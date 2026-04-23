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
            ->get()
            ->each->makeVisible(['email']);

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
        // Admin panel legitimately needs PII the frontend hides by default.
        $users->getCollection()->each->makeVisible(['email', 'banned_at', 'ban_reason']);

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Single-user detail page for moderation decisions. Bundles every
     * signal a mod or admin would want before banning/killing: ratings,
     * reports, referrals, LFGs, and the audit trail of previous admin
     * actions on this account.
     */
    public function showUser(User $user): Response
    {
        $user->load([
            'profile',
            'games',
            'referredBy:id,name',
            'referredBy.profile:user_id,username',
        ]);

        $friendsCount = \App\Models\PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->count();

        $invitees = User::where('referred_by_user_id', $user->id)
            ->with('profile:user_id,username')
            ->latest()
            ->take(25)
            ->get(['id', 'name', 'created_at', 'is_banned']);

        $recentLfg = \App\Models\LfgPost::where('user_id', $user->id)
            ->with('game:id,name,slug,cover_image')
            ->latest()
            ->take(10)
            ->get(['id', 'slug', 'title', 'status', 'game_id', 'created_at']);

        $reportsAgainst = \App\Models\Report::where('reported_id', $user->id)
            ->with(['reporter:id,name', 'reporter.profile:user_id,username'])
            ->latest()
            ->take(20)
            ->get(['id', 'reporter_id', 'reason', 'details', 'status', 'created_at']);

        $reportsFiled = \App\Models\Report::where('reporter_id', $user->id)
            ->with(['reported:id,name', 'reported.profile:user_id,username'])
            ->latest()
            ->take(20)
            ->get(['id', 'reported_id', 'reason', 'details', 'status', 'created_at']);

        $auditTrail = \App\Models\AdminAction::where('target_user_id', $user->id)
            ->with(['actor:id,name,is_owner', 'actor.profile:user_id,username'])
            ->latest('created_at')
            ->take(30)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'action' => $a->action,
                'metadata' => $a->metadata,
                'created_at_human' => $a->created_at?->diffForHumans(),
                'created_at' => $a->created_at?->toDateTimeString(),
                'actor' => $a->actor ? [
                    'id' => $a->actor->id,
                    'name' => $a->actor->profile?->username ?? $a->actor->name,
                    'is_owner' => (bool) $a->actor->is_owner,
                ] : null,
            ]);

        $ratingCount = \App\Models\LfgRating::where('rated_id', $user->id)->count()
            + \App\Models\PlayerRating::where('rated_id', $user->id)->count();

        $lfgHosted = \App\Models\LfgPost::where('user_id', $user->id)->count();

        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_at' => $user->created_at?->toDateTimeString(),
                'last_active' => $user->updated_at?->diffForHumans(),
                'is_admin' => (bool) $user->is_admin,
                'is_moderator' => (bool) $user->is_moderator,
                'is_owner' => (bool) $user->is_owner,
                'is_banned' => (bool) $user->is_banned,
                'banned_at' => $user->banned_at?->toDateTimeString(),
                'ban_reason' => $user->ban_reason,
                'referral_code' => $user->referral_code,
                'profile' => $user->profile ? [
                    'username' => $user->profile->username,
                    'avatar' => $user->profile->avatar,
                    'bio' => $user->profile->bio,
                    'region' => $user->profile->region,
                    'looking_for' => $user->profile->looking_for,
                    'reputation_score' => $user->profile->reputation_score,
                    'level' => $user->profile->level ?? null,
                ] : null,
                'games' => $user->games->map(fn ($g) => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'rank' => $g->pivot->rank,
                    'platform' => $g->pivot->platform,
                ]),
                'referred_by' => $user->referredBy ? [
                    'id' => $user->referredBy->id,
                    'name' => $user->referredBy->profile?->username ?? $user->referredBy->name,
                ] : null,
            ],
            'stats' => [
                'friends' => $friendsCount,
                'lfg_hosted' => $lfgHosted,
                'invitees' => $invitees->count(),
                'rating_count' => $ratingCount,
                'reports_against' => $reportsAgainst->count(),
                'reports_filed' => $reportsFiled->count(),
            ],
            'invitees' => $invitees,
            'recentLfg' => $recentLfg,
            'reportsAgainst' => $reportsAgainst,
            'reportsFiled' => $reportsFiled,
            'auditTrail' => $auditTrail,
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

        // Kill every active session AND the remember cookie. Before this
        // we only wiped the remember token, which meant the user stayed
        // logged in until their next request would trigger EnsureNotBanned.
        // With database sessions we can evict them immediately.
        $user->update(['remember_token' => null]);
        try {
            \Illuminate\Support\Facades\DB::table('sessions')
                ->where('user_id', $user->id)
                ->delete();
        } catch (\Throwable $e) {
            \Log::warning('Failed to purge sessions on ban', ['user_id' => $user->id, 'error' => $e->getMessage()]);
        }

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

        AdminAudit::log('report.resolved', $report->reported, [
            'report_id' => $report->id,
            'status' => $request->input('status'),
            'reason' => $report->reason,
        ]);

        return response()->json(['success' => true]);
    }

    /**
     * Mod-only hard delete of an LFG post reached from a report. Separate
     * from LfgController::destroy because that's gated to the creator
     * plus a "no accepted members" rule — mods override both.
     */
    public function deleteLfgPost(\App\Models\LfgPost $lfgPost)
    {
        // Capture attribution before the cascade wipes the post.
        $hostId = $lfgPost->user_id;
        $title = $lfgPost->title;
        $slug = $lfgPost->slug;
        $host = \App\Models\User::find($hostId);

        $lfgPost->delete(); // FK cascade cleans responses / messages / ratings

        AdminAudit::log('lfg.deleted', $host, [
            'lfg_post_id' => $lfgPost->id,
            'slug' => $slug,
            'title' => $title,
        ]);

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

        $game = Game::create($validated);

        AdminAudit::log('game.created', null, [
            'game_id' => $game->id,
            'name' => $game->name,
        ]);

        return redirect()->route('admin.games')->with('message', 'Game added!');
    }

    public function deleteGame(Game $game)
    {
        $gameName = $game->name;
        $gameId = $game->id;
        $game->delete();

        AdminAudit::log('game.deleted', null, [
            'game_id' => $gameId,
            'name' => $gameName,
        ]);

        return response()->json(['success' => true]);
    }
}
