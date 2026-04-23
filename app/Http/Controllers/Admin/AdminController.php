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
                    'is_creator' => (bool) $user->profile->is_creator,
                    'featured_until' => $user->profile->featured_until?->toDateTimeString(),
                    'is_featured_now' => $user->profile->isFeatured(),
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

    /**
     * Toggle Creator Spotlight membership for this user's profile.
     * Passing duration_days extends/sets; passing 0 (or omitting when
     * already featured) retires the slot. Always checks is_creator
     * first — non-creators never land in the spotlight even by admin
     * mistake.
     */
    public function setFeatured(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'duration_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'tier' => ['nullable', 'in:free,promoted'],
        ]);

        if (!$user->profile) {
            return response()->json(['error' => 'User has no profile yet.'], 422);
        }
        if (!$user->profile->is_creator) {
            return response()->json(['error' => 'Only creators can be spotlighted. Mark is_creator on their profile first.'], 422);
        }

        $days = (int) ($data['duration_days'] ?? 7);
        $tier = $data['tier'] ?? \App\Models\Profile::SPOTLIGHT_TIER_FREE;
        $previous = $user->profile->featured_until;

        if ($days === 0) {
            $user->profile->update([
                'featured_until' => null,
                'spotlight_tier' => \App\Models\Profile::SPOTLIGHT_TIER_FREE,
            ]);
            AdminAudit::log('creator.spotlight_removed', $user);
            return response()->json(['featured_until' => null, 'spotlight_tier' => 'free']);
        }

        $until = now()->addDays($days);
        $user->profile->update([
            'featured_until' => $until,
            'spotlight_tier' => $tier,
        ]);

        AdminAudit::log('creator.spotlight_set', $user, [
            'until' => $until->toDateTimeString(),
            'duration_days' => $days,
            'tier' => $tier,
            'was_already_featured' => $previous !== null && $previous->isFuture(),
        ]);

        return response()->json([
            'featured_until' => $until->toDateTimeString(),
            'spotlight_tier' => $tier,
        ]);
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

    /**
     * Dedicated hub for managing the Creator Spotlight roster. Shows
     * every is_creator profile with their clip count, current spotlight
     * state + days remaining. Drives the per-user detail page for the
     * actual toggle action so we keep one source of truth on that.
     */
    /**
     * Admin analytics hub: internal platform stats (signups, activity,
     * content, top games/regions) from the DB, plus a link out to
     * Plausible for visitor-side data (pageviews, sources, countries).
     */
    public function analytics(): Response
    {
        $now = now();
        $startOfToday = $now->copy()->startOfDay();
        $day30Ago = $now->copy()->subDays(30)->startOfDay();

        // Headline counters
        $headline = \Illuminate\Support\Facades\Cache::remember('analytics:headline', 120, function () use ($now, $startOfToday) {
            return [
                'total_users' => \App\Models\User::count(),
                'total_profiles' => \App\Models\Profile::count(),
                'signups_today' => \App\Models\User::where('created_at', '>=', $startOfToday)->count(),
                'signups_7d' => \App\Models\User::where('created_at', '>=', $now->copy()->subDays(7))->count(),
                'signups_30d' => \App\Models\User::where('created_at', '>=', $now->copy()->subDays(30))->count(),
                // "Active" = the user model's updated_at (TrackLastActivity middleware
                // bumps this on every authenticated request).
                'dau' => \App\Models\User::where('updated_at', '>=', $now->copy()->subDay())->count(),
                'wau' => \App\Models\User::where('updated_at', '>=', $now->copy()->subWeek())->count(),
                'mau' => \App\Models\User::where('updated_at', '>=', $now->copy()->subMonth())->count(),
                'online_now' => \App\Models\User::where('updated_at', '>=', $now->copy()->subMinutes(15))->count(),
                // Demand signal for the future Plus tier — counts how many
                // visitors have actually opted in via /plus. 0 == build it
                // later; growing == real validation.
                'plus_waitlist' => \Illuminate\Support\Facades\Schema::hasTable('plus_waitlist')
                    ? \Illuminate\Support\Facades\DB::table('plus_waitlist')->count()
                    : 0,
            ];
        });

        // Daily series for last 30 days — signups / LFGs / matches
        $series = \Illuminate\Support\Facades\Cache::remember('analytics:series', 300, function () use ($day30Ago) {
            $labels = [];
            $days = [];
            for ($i = 29; $i >= 0; $i--) {
                $d = now()->copy()->subDays($i)->startOfDay();
                $labels[] = $d->format('M d');
                $days[$d->toDateString()] = ['signups' => 0, 'lfgs' => 0, 'matches' => 0, 'messages' => 0];
            }

            foreach (\App\Models\User::where('created_at', '>=', $day30Ago)
                ->selectRaw('DATE(created_at) as d, count(*) as c')
                ->groupBy('d')->get() as $row) {
                if (isset($days[$row->d])) $days[$row->d]['signups'] = (int) $row->c;
            }
            foreach (\App\Models\LfgPost::where('created_at', '>=', $day30Ago)
                ->selectRaw('DATE(created_at) as d, count(*) as c')
                ->groupBy('d')->get() as $row) {
                if (isset($days[$row->d])) $days[$row->d]['lfgs'] = (int) $row->c;
            }
            foreach (\App\Models\PlayerMatch::where('created_at', '>=', $day30Ago)
                ->selectRaw('DATE(created_at) as d, count(*) as c')
                ->groupBy('d')->get() as $row) {
                if (isset($days[$row->d])) $days[$row->d]['matches'] = (int) $row->c;
            }
            foreach (\App\Models\Message::where('created_at', '>=', $day30Ago)
                ->selectRaw('DATE(created_at) as d, count(*) as c')
                ->groupBy('d')->get() as $row) {
                if (isset($days[$row->d])) $days[$row->d]['messages'] = (int) $row->c;
            }

            return [
                'labels' => $labels,
                'signups' => array_values(array_column($days, 'signups')),
                'lfgs' => array_values(array_column($days, 'lfgs')),
                'matches' => array_values(array_column($days, 'matches')),
                'messages' => array_values(array_column($days, 'messages')),
            ];
        });

        // Content totals
        $content = \Illuminate\Support\Facades\Cache::remember('analytics:content', 300, function () {
            return [
                'lfgs_total' => \App\Models\LfgPost::count(),
                'lfgs_open' => \App\Models\LfgPost::where('status', 'open')->count(),
                'matches_total' => \App\Models\PlayerMatch::count(),
                'messages_total' => \App\Models\Message::count(),
                'community_posts_total' => \App\Models\CommunityPost::count(),
                'clips_total' => \App\Models\Clip::count(),
                'ratings_total' => \App\Models\PlayerRating::count() + \App\Models\LfgRating::count(),
            ];
        });

        // Top games + regions
        $topGames = \Illuminate\Support\Facades\Cache::remember('analytics:topgames', 600, function () {
            return \App\Models\Game::withCount('users')
                ->orderByDesc('users_count')
                ->take(10)
                ->get(['id', 'name', 'slug', 'cover_image'])
                ->map(fn ($g) => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'slug' => $g->slug,
                    'cover_image' => $g->cover_image,
                    'users_count' => $g->users_count,
                ]);
        });

        $topRegions = \Illuminate\Support\Facades\Cache::remember('analytics:topregions', 600, function () {
            return \Illuminate\Support\Facades\DB::table('profiles')
                ->select('region', \Illuminate\Support\Facades\DB::raw('count(*) as c'))
                ->whereNotNull('region')
                ->where('region', '!=', '')
                ->groupBy('region')
                ->orderByDesc('c')
                ->limit(10)
                ->get()
                ->map(fn ($r) => ['region' => $r->region, 'count' => (int) $r->c]);
        });

        // Native pageview tracker stats — comes from our own page_views
        // table (TrackPageView middleware logs one row per tracked GET).
        // Zero external deps, cached 2 min.
        $traffic = \Illuminate\Support\Facades\Cache::remember(
            'analytics:traffic',
            120,
            fn () => \App\Services\PageViewStats::summary(),
        );

        return Inertia::render('Admin/Analytics', [
            'headline' => $headline,
            'series' => $series,
            'content' => $content,
            'topGames' => $topGames,
            'topRegions' => $topRegions,
            'traffic' => $traffic,
        ]);
    }

    public function creators(Request $request): Response
    {
        $filter = $request->input('filter', 'all'); // all | featured | idle

        $query = User::with('profile')
            ->whereHas('profile', fn ($q) => $q->where('is_creator', true))
            ->withCount('clips');

        if ($filter === 'featured') {
            $query->whereHas('profile', function ($q) {
                $q->whereNotNull('featured_until')->where('featured_until', '>', now());
            });
        } elseif ($filter === 'idle') {
            $query->whereDoesntHave('profile', function ($q) {
                $q->whereNotNull('featured_until')->where('featured_until', '>', now());
            });
        }

        $creators = $query->latest()->paginate(25)->withQueryString();
        $creators->getCollection()->each->makeVisible(['email']);

        // Counts for the filter tab pills.
        $counts = [
            'all' => User::whereHas('profile', fn ($q) => $q->where('is_creator', true))->count(),
            'featured' => User::whereHas('profile', function ($q) {
                $q->where('is_creator', true)
                    ->whereNotNull('featured_until')
                    ->where('featured_until', '>', now());
            })->count(),
        ];
        $counts['idle'] = $counts['all'] - $counts['featured'];

        return Inertia::render('Admin/Creators', [
            'creators' => $creators,
            'filters' => ['filter' => $filter],
            'counts' => $counts,
        ]);
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
