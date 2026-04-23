<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CommunityPost;
use App\Models\Game;
use App\Models\LfgPost;
use App\Models\PlayerMatch;
use App\Models\Report;
use App\Models\User;
use App\Services\AdminAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function dashboard(): Response
    {
        $stats = [
            'totalUsers' => User::count(),
            'usersWithProfile' => User::whereHas('profile')->count(),
            'usersToday' => User::whereDate('created_at', today())->count(),
            'usersThisWeek' => User::where('created_at', '>=', now()->subWeek())->count(),
            'totalFriends' => PlayerMatch::count(),
            'totalGames' => Game::count(),
            'activeLfg' => LfgPost::where('status', 'open')->count(),
            'totalPosts' => CommunityPost::count(),
            'pendingReports' => Report::where('status', 'pending')->count(),
            'onlineNow' => User::where('updated_at', '>=', now()->subMinutes(15))->count(),
        ];

        $recentReports = Report::with(['reporter.profile', 'reported.profile', 'lfgPost.game'])
            ->where('status', 'pending')
            ->latest()
            ->take(10)
            ->get();

        $recentUsers = User::with('profile')
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentReports' => $recentReports,
            'recentUsers' => $recentUsers,
        ]);
    }

    public function users(Request $request): Response
    {
        $query = User::with('profile')->withCount(['games', 'clips']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhereHas('profile', fn ($p) => $p->where('username', 'like', "%{$search}%"));
            });
        }

        $users = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => $request->only('search'),
        ]);
    }

    /** Toggle a user's moderator role. Admin-only. */
    public function setModerator(Request $request, User $user): JsonResponse
    {
        if ($user->isOwner()) {
            return response()->json(['error' => "The platform owner's roles can't be modified."], 403);
        }
        $data = $request->validate(['is_moderator' => ['required', 'boolean']]);
        if ($user->is_admin) {
            return response()->json(['error' => "Admins already have moderator powers."], 422);
        }
        $previouslyMod = (bool) $user->is_moderator;
        $user->update(['is_moderator' => $data['is_moderator']]);

        if ($data['is_moderator'] !== $previouslyMod) {
            AdminAudit::log(
                $data['is_moderator'] ? 'user.role.moderator_granted' : 'user.role.moderator_revoked',
                $user,
            );
        }

        if ($data['is_moderator'] && !$previouslyMod) {
            try {
                $user->notify(new \App\Notifications\RoleGrantedNotification('moderator', auth()->user()?->name));
                \Illuminate\Support\Facades\Cache::forget("user:{$user->id}:unread");
            } catch (\Throwable $e) {
                \Log::error('RoleGranted dispatch failed: ' . $e->getMessage());
            }
        }

        return response()->json(['is_moderator' => $user->is_moderator]);
    }

    /** Toggle a user's admin role. Admin-only. Self-demotion + owner protected. */
    public function setAdmin(Request $request, User $user): JsonResponse
    {
        if ($user->isOwner()) {
            return response()->json(['error' => "The platform owner's admin status is permanent."], 403);
        }
        $data = $request->validate(['is_admin' => ['required', 'boolean']]);
        if (!$data['is_admin'] && $user->id === auth()->id()) {
            return response()->json(['error' => "You can't demote yourself."], 422);
        }
        $previouslyAdmin = (bool) $user->is_admin;
        $user->update(['is_admin' => $data['is_admin']]);

        if ($data['is_admin'] !== $previouslyAdmin) {
            AdminAudit::log(
                $data['is_admin'] ? 'user.role.admin_granted' : 'user.role.admin_revoked',
                $user,
            );
        }

        if ($data['is_admin'] && !$previouslyAdmin) {
            try {
                $user->notify(new \App\Notifications\RoleGrantedNotification('admin', auth()->user()?->name));
                \Illuminate\Support\Facades\Cache::forget("user:{$user->id}:unread");
            } catch (\Throwable $e) {
                \Log::error('RoleGranted dispatch failed: ' . $e->getMessage());
            }
        }

        return response()->json(['is_admin' => $user->is_admin]);
    }

    public function banUser(Request $request, User $user)
    {
        if ($user->isOwner()) {
            \Log::warning('Ban attempted against platform owner', ['by_admin_id' => auth()->id(), 'target_user_id' => $user->id]);
            return response()->json(['error' => "The platform owner can't be banned."], 403);
        }
        if ($user->is_admin) {
            return response()->json(['error' => 'Cannot ban admins'], 422);
        }

        $user->update([
            'is_banned' => true,
            'banned_at' => now(),
            'ban_reason' => $request->input('reason', 'Banned by admin'),
        ]);

        // Close all their active LFG groups
        \App\Models\LfgPost::where('user_id', $user->id)
            ->whereIn('status', ['open', 'full'])
            ->update(['status' => 'closed']);

        // Invalidate all sessions by cycling the remember token
        $user->update(['remember_token' => null]);

        AdminAudit::log('user.banned', $user, ['reason' => $request->input('reason')]);
        \Log::info('User banned', ['user_id' => $user->id, 'admin_id' => auth()->id(), 'reason' => $request->input('reason')]);

        return response()->json(['success' => true]);
    }

    public function unbanUser(Request $request, User $user)
    {
        if (!$user->is_banned) {
            return response()->json(['error' => 'User is not banned.'], 422);
        }

        $user->update([
            'is_banned' => false,
            'banned_at' => null,
            'ban_reason' => null,
        ]);

        AdminAudit::log('user.unbanned', $user);
        \Log::info('User unbanned', ['user_id' => $user->id, 'admin_id' => auth()->id()]);

        return response()->json(['success' => true]);
    }

    public function reports(Request $request): Response
    {
        $query = Report::with(['reporter.profile', 'reported.profile', 'lfgPost.game']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        } else {
            $query->where('status', 'pending');
        }

        $reports = $query->latest()->paginate(25)->withQueryString();

        return Inertia::render('Admin/Reports', [
            'reports' => $reports,
            'filters' => $request->only('status'),
        ]);
    }

    public function resolveReport(Report $report, Request $request)
    {
        $request->validate(['status' => 'required|in:reviewed,resolved']);
        $report->update(['status' => $request->input('status')]);

        return response()->json(['success' => true]);
    }

    /**
     * Mod-only hard delete of an LFG post reached from a report. Separate
     * from LfgController::destroy because that's gated to the creator
     * plus a "no accepted members" rule — mods override both.
     */
    public function deleteLfgPost(\App\Models\LfgPost $lfgPost)
    {
        $lfgPost->delete(); // FK cascade cleans responses / messages / ratings
        return response()->json(['success' => true]);
    }

    public function games(): Response
    {
        $games = Game::withCount('users')->get();

        return Inertia::render('Admin/Games', [
            'games' => $games,
        ]);
    }

    public function storeGame(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'genre' => 'required|string|max:100',
            'platforms' => 'required|array',
            'cover_image' => 'nullable|string|max:255',
            'rank_system' => 'nullable|array',
            'roles' => 'nullable|array',
        ]);

        $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);

        Game::create($validated);

        return redirect()->route('admin.games')->with('message', 'Game added!');
    }

    public function deleteGame(Game $game)
    {
        $game->delete();
        return response()->json(['success' => true]);
    }
}
