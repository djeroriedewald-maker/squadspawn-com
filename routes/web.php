<?php

use App\Http\Controllers\AvatarController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DiscoveryController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\GameProfileController;
use App\Http\Controllers\GamesController;
use App\Http\Controllers\BlockController;
use App\Http\Controllers\ClipController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\LfgController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AchievementController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\SearchController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::put('/settings/theme', [\App\Http\Controllers\ThemeController::class, 'update'])
    ->middleware('throttle:30,1')
    ->name('settings.theme');

Route::get('/privacy-policy', fn () => Inertia::render('Legal/PrivacyPolicy'))->name('legal.privacy');
Route::get('/terms-of-service', fn () => Inertia::render('Legal/TermsOfService'))->name('legal.terms');
Route::get('/cookie-policy', fn () => Inertia::render('Legal/CookiePolicy'))->name('legal.cookies');
Route::get('/help', fn () => Inertia::render('Help/Index'))->name('help');

// Changelog — public for SEO + shareability.
Route::get('/changelog', [\App\Http\Controllers\ChangelogController::class, 'index'])->name('changelog.index');
Route::get('/changelog/{slug}', [\App\Http\Controllers\ChangelogController::class, 'show'])
    ->where('slug', '[a-z0-9\-]+')
    ->name('changelog.show');

Route::get('/', function () {
    // Logged-in users have outgrown the marketing homepage — bounce them
    // straight to the dashboard. Also fixes a mobile-back annoyance where
    // tapping back would land them on the landing page instead of wherever
    // they were actually working.
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    $totalPlayers = Cache::remember('home:players', 300, fn () => \App\Models\User::whereHas('profile')->count());
    $totalGames = Cache::remember('home:games', 300, fn () => \App\Models\Game::count());
    $activeLfg = Cache::remember('home:lfg', 300, fn () => \App\Models\LfgPost::where('status', 'open')->count());
    $topGames = Cache::remember('home:topgames', 300, fn () => \App\Models\Game::withCount('users')->orderByDesc('users_count')->take(24)->get()->toArray());
    $recentPlayers = Cache::remember('home:recent', 300, fn () => \App\Models\Profile::with('user')->latest()->take(8)->get()->toArray());
    $onlineNow = Cache::remember('home:online', 120, fn () => \App\Models\User::where('updated_at', '>=', now()->subMinutes(15))->count());

    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'totalPlayers' => $totalPlayers,
        'totalGames' => $totalGames,
        'activeLfg' => $activeLfg,
        'topGames' => $topGames,
        'recentPlayers' => $recentPlayers,
        'onlineNow' => $onlineNow,
        'seo' => [
            'title' => 'SquadSpawn · Find Your Gaming Squad',
            'description' => $totalPlayers < 500
                ? "Join the founding squad of SquadSpawn. Create LFG groups, find verified teammates across {$totalGames}+ games, and build your reputation from day one."
                : "Create LFG groups, find verified teammates across {$totalGames}+ games, and rate players after every session. Trusted by {$totalPlayers}+ gamers worldwide.",
        ],
    ]);
});

Route::get('/dashboard', function () {
    $user = auth()->user();
    $user->load(['profile', 'games']);

    $matchCount = \App\Models\PlayerMatch::where('user_one_id', $user->id)
        ->orWhere('user_two_id', $user->id)
        ->count();

    $recentMatches = \App\Models\PlayerMatch::where('user_one_id', $user->id)
        ->orWhere('user_two_id', $user->id)
        ->with(['userOne.profile', 'userTwo.profile'])
        ->latest()
        ->take(5)
        ->get()
        ->map(function ($match) use ($user) {
            return [
                'id' => $match->id,
                'chat_id' => $match->uuid,
                'partner' => $match->user_one_id === $user->id ? $match->userTwo : $match->userOne,
                'created_at' => $match->created_at,
            ];
        });

    $allGames = Cache::remember('dash:allgames', 300, fn () => \App\Models\Game::withCount('users')->get()->toArray());

    // How many people liked this user (motivation to swipe)
    $likedByCount = $user->likedByUsers()->count();

    // Suggested players: share at least one game, not yet liked/passed
    $likedIds = $user->likedUsers()->pluck('liked_id');
    $passedIds = \App\Models\Pass::where('passer_id', $user->id)->pluck('passed_id');
    $excludeIds = $likedIds->merge($passedIds)->push($user->id);
    $userGameIds = $user->games->pluck('id');

    $suggestedPlayers = $userGameIds->isNotEmpty()
        ? \App\Models\User::whereNotIn('id', $excludeIds)
            ->whereHas('profile')
            ->whereHas('games', fn ($q) => $q->whereIn('games.id', $userGameIds))
            ->with(['profile', 'games'])
            ->inRandomOrder()
            ->take(4)
            ->get()
        : collect();

    // Platform stats (cached - shared across all users)
    $totalPlayers = Cache::remember('dash:players', 120, fn () => \App\Models\User::whereHas('profile')->count());
    $newPlayersToday = Cache::remember('dash:newtoday', 120, fn () => \App\Models\User::whereHas('profile')->whereDate('created_at', today())->count());
    $onlineRecent = Cache::remember('dash:online', 30, fn () => \App\Models\User::where('updated_at', '>=', now()->subMinutes(15))->count());

    // Trending games (cached 5 min)
    $trendingGames = Cache::remember('dash:trending', 300, function () {
        $trendingGameIds = \App\Models\UserGame::where('created_at', '>=', now()->subDays(7))
            ->select('game_id')
            ->selectRaw('count(*) as cnt')
            ->groupBy('game_id')
            ->orderByDesc('cnt')
            ->take(5)
            ->pluck('game_id');
        return \App\Models\Game::whereIn('id', $trendingGameIds)->withCount('users')->get();
    });

    // Activity feed (cached 1 min) — anonymized by design. We expose the
    // event type + a human timestamp so the dashboard feels live, but no
    // usernames or avatars leave the server. This avoids broadcasting
    // personal data (names, friendships) that individual users didn't
    // explicitly opt in to publish.
    $activityFeed = Cache::remember('dash:activity', 60, function () {
        $recentProfiles = \App\Models\Profile::latest()
            ->take(5)
            ->get()
            ->map(fn ($p) => [
                'type' => 'joined',
                'time' => $p->created_at->diffForHumans(),
                'sort_at' => $p->created_at->timestamp,
            ]);

        $recentFriendships = \App\Models\PlayerMatch::latest()
            ->take(5)
            ->get()
            ->map(fn ($m) => [
                'type' => 'friends',
                'time' => $m->created_at->diffForHumans(),
                'sort_at' => $m->created_at->timestamp,
            ]);

        return $recentProfiles->merge($recentFriendships)
            ->sortByDesc('sort_at')
            ->take(8)
            ->map(fn ($event) => collect($event)->except('sort_at')->toArray())
            ->values()
            ->toArray();
    });

    $relevantLfg = $userGameIds->isNotEmpty()
        ? \App\Models\LfgPost::open()
            ->whereIn('game_id', $userGameIds)
            ->with(['user.profile', 'game'])
            ->latest()
            ->take(3)
            ->get()
        : collect();

    // Achievements for dashboard showcase
    $recentAchievements = $user->achievements()->latest('user_achievements.created_at')->take(4)->get();
    $totalAchievementPoints = $user->achievements()->sum('points');
    $lfgHosted = \App\Models\LfgPost::where('user_id', $user->id)->count();
    $messagesCount = \App\Models\Message::where('sender_id', $user->id)->count();

    // Rating funnel — closed LFG sessions the user was in that still have
    // un-rated teammates. Drives the reputation system's data quality.
    //
    // The take(50) pre-filter + take(5) post-filter keep this bounded for
    // power users: even someone with hundreds of closed sessions hits the
    // same query cost, and the dashboard only ever shows a handful of
    // cards. Picked 50 so fully-rated recent sessions can't crowd out a
    // legitimate unrated one.
    $pendingRatings = \App\Models\LfgPost::where('status', 'closed')
        ->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->orWhereHas('responses', fn ($r) => $r->where('user_id', $user->id)->where('status', 'accepted'));
        })
        ->with(['game', 'responses' => fn ($q) => $q->where('status', 'accepted')->with('user.profile'), 'user.profile', 'ratings'])
        ->latest()
        ->take(50)
        ->get()
        ->filter(function ($post) use ($user) {
            $teammates = collect([$post->user])
                ->merge($post->responses->pluck('user'))
                ->filter()
                ->unique('id')
                ->reject(fn ($u) => $u->id === $user->id);
            $myRated = $post->ratings->where('rater_id', $user->id)->pluck('rated_id');
            return $teammates->pluck('id')->diff($myRated)->isNotEmpty();
        })
        ->take(5)
        ->values()
        ->map(fn ($p) => [
            'slug' => $p->slug,
            'title' => $p->title,
            'game' => $p->game ? ['name' => $p->game->name, 'cover_image' => $p->game->cover_image] : null,
            'closed_at' => $p->updated_at->diffForHumans(),
        ]);

    return Inertia::render('Dashboard', [
        'matchCount' => $matchCount,
        'recentMatches' => $recentMatches,
        'allGames' => $allGames,
        'likedByCount' => $likedByCount,
        'suggestedPlayers' => $suggestedPlayers,
        'totalPlayers' => $totalPlayers,
        'newPlayersToday' => $newPlayersToday,
        'onlineRecent' => $onlineRecent,
        'trendingGames' => $trendingGames,
        'activityFeed' => $activityFeed,
        'relevantLfg' => $relevantLfg,
        'recentAchievements' => $recentAchievements,
        'totalAchievementPoints' => $totalAchievementPoints,
        'lfgHosted' => $lfgHosted,
        'messagesCount' => $messagesCount,
        'pendingRatings' => $pendingRatings,
    ]);
})->middleware(['auth', 'verified', 'age.verified', 'profile.complete'])->name('dashboard');

// Public
Route::get('/games', [GamesController::class, 'index'])->name('games.index');
Route::get('/games/{slug}', [GamesController::class, 'show'])
    ->where('slug', '[a-z0-9\-]+')
    ->name('games.show');
Route::get('/player/{username}', [PlayerController::class, 'show'])->name('player.show');
Route::get('/clips', [ClipController::class, 'index'])->middleware('feature:clips')->name('clips.index');
Route::get('/redirect', [\App\Http\Controllers\RedirectController::class, 'redirect'])->name('external.redirect');
Route::get('/search', [SearchController::class, 'search'])->middleware(['auth', 'throttle:30,1'])->name('search');

// Community (public viewing) — gated by the `community` feature flag.
Route::middleware('feature:community')->group(function () {
    Route::get('/community', [CommunityController::class, 'index'])->name('community.index');
    Route::get('/community/team', [CommunityController::class, 'team'])->name('community.team');
    Route::get('/community/guidelines', [CommunityController::class, 'guidelines'])->name('community.guidelines');
    Route::get('/community/create', [CommunityController::class, 'create'])->middleware('auth')->name('community.create');
    Route::get('/community/{communityPost}/edit', [CommunityController::class, 'edit'])->middleware('auth')->name('community.edit');
    Route::get('/community/{communityPost}', [CommunityController::class, 'show'])->name('community.show');
});

Route::middleware(['auth', 'age.verified'])->group(function () {
    // Impersonation stop — the impersonated user holds the original
    // admin id in their session and clicks the red return banner.
    Route::post('/impersonate/stop', [\App\Http\Controllers\Admin\ImpersonationController::class, 'stop'])->name('impersonate.stop');

    // Notifications
    Route::get('/notifications/poll', [\App\Http\Controllers\NotificationController::class, 'poll'])->name('notifications.poll');
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllRead'])->name('notifications.readAll');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markRead'])->name('notifications.markRead');

    // Announcements (user side of broadcasts)
    Route::get('/announcements', [\App\Http\Controllers\BroadcastViewController::class, 'index'])->name('announcements.index');
    Route::post('/announcements/{broadcast}/viewed', [\App\Http\Controllers\BroadcastViewController::class, 'markViewed'])->middleware('throttle:60,1')->name('announcements.viewed');
    Route::post('/announcements/{broadcast}/dismiss', [\App\Http\Controllers\BroadcastViewController::class, 'dismiss'])->middleware('throttle:30,1')->name('announcements.dismiss');
    Route::post('/announcements/{broadcast}/clicked', [\App\Http\Controllers\BroadcastViewController::class, 'clicked'])->middleware('throttle:30,1')->name('announcements.clicked');

    // Age verification (for Google OAuth users who skipped registration form)
    Route::get('/verify-age', [\App\Http\Controllers\Auth\AgeVerificationController::class, 'show'])->name('age-verification');
    Route::post('/verify-age', [\App\Http\Controllers\Auth\AgeVerificationController::class, 'store'])->name('age-verification.store');

    Route::get('/players', [\App\Http\Controllers\DiscoveryController::class, 'publicIndex'])->name('players.public');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Self-service role management — mods / admins can step down
    Route::get('/settings/role', [\App\Http\Controllers\RoleSettingsController::class, 'show'])->name('settings.role');
    Route::post('/settings/role/step-down-mod', [\App\Http\Controllers\RoleSettingsController::class, 'stepDownMod'])->name('settings.role.stepDownMod');
    Route::post('/settings/role/step-down-admin', [\App\Http\Controllers\RoleSettingsController::class, 'stepDownAdmin'])->name('settings.role.stepDownAdmin');

    // GDPR Art. 20 — data portability
    Route::get('/profile/data-export', [\App\Http\Controllers\DataExportController::class, 'index'])
        ->middleware('throttle:3,10')
        ->name('profile.dataExport');

    // Clips (gated by the `clips` feature flag)
    Route::middleware('feature:clips')->group(function () {
        Route::post('/clips', [ClipController::class, 'store'])->middleware('throttle:10,1')->name('clips.store');
        Route::delete('/clips/{clip}', [ClipController::class, 'destroy'])->name('clips.destroy');
    });

    // Quick add/remove a game to/from my profile
    Route::post('/games/{game}/add', [GamesController::class, 'quickAdd'])->middleware('throttle:30,1')->name('games.quickAdd');
    Route::delete('/games/{game}/remove', [GamesController::class, 'quickRemove'])->middleware('throttle:30,1')->name('games.quickRemove');

    // Web Push subscriptions
    Route::get('/push/config', [\App\Http\Controllers\PushSubscriptionController::class, 'config'])->name('push.config');
    Route::post('/push/subscribe', [\App\Http\Controllers\PushSubscriptionController::class, 'store'])->middleware('throttle:10,1')->name('push.subscribe');
    Route::delete('/push/subscribe', [\App\Http\Controllers\PushSubscriptionController::class, 'destroy'])->middleware('throttle:10,1')->name('push.unsubscribe');

    // Per-type push preferences
    Route::get('/notification-preferences', [\App\Http\Controllers\NotificationPreferencesController::class, 'show'])->name('notifPrefs.show');
    Route::put('/notification-preferences', [\App\Http\Controllers\NotificationPreferencesController::class, 'update'])->name('notifPrefs.update');

    // Invite friends
    Route::get('/invite', [\App\Http\Controllers\InviteController::class, 'index'])->name('invite.index');

    // Steam account linking
    Route::get('/steam/link', [\App\Http\Controllers\SteamLinkController::class, 'show'])->name('steam.link.show');
    Route::post('/steam/link', [\App\Http\Controllers\SteamLinkController::class, 'store'])->middleware('throttle:10,1')->name('steam.link.store');
    Route::delete('/steam/link', [\App\Http\Controllers\SteamLinkController::class, 'destroy'])->name('steam.link.destroy');
    Route::post('/steam/stats/refresh', [\App\Http\Controllers\SteamLinkController::class, 'refresh'])->middleware('throttle:6,1')->name('steam.stats.refresh');

    // Avatar
    Route::post('/avatar/upload', [AvatarController::class, 'upload'])->middleware('throttle:10,1')->name('avatar.upload');
    Route::post('/avatar/preset', [AvatarController::class, 'setPreset'])->name('avatar.preset');

    // Banner (phase-2 user upload, gated behind level 2+)
    Route::post('/banner/upload', [\App\Http\Controllers\BannerController::class, 'upload'])->middleware('throttle:5,1')->name('banner.upload');
    Route::delete('/banner', [\App\Http\Controllers\BannerController::class, 'destroy'])->middleware('throttle:10,1')->name('banner.destroy');

    // Game Profile
    Route::get('/profile/me', [GameProfileController::class, 'show'])->name('game-profile.show');
    Route::get('/profile/setup', [GameProfileController::class, 'edit'])->name('game-profile.edit');
    Route::put('/profile/setup', [GameProfileController::class, 'update'])->name('game-profile.update');

    // Achievements
    Route::get('/achievements', [AchievementController::class, 'index'])->name('achievements.index');

    // Community (auth actions) — gated by `community` feature flag.
    Route::middleware('feature:community')->group(function () {
        Route::post('/community', [CommunityController::class, 'store'])->middleware('throttle:10,1')->name('community.store');
        Route::put('/community/{communityPost}', [CommunityController::class, 'update'])->middleware('throttle:30,1')->name('community.update');
        Route::delete('/community/{communityPost}', [CommunityController::class, 'destroy'])->name('community.destroy');
        Route::post('/community/{communityPost}/vote', [CommunityController::class, 'vote'])->name('community.vote');
        Route::post('/community/{communityPost}/comment', [CommunityController::class, 'comment'])->name('community.comment');
        Route::delete('/community/comment/{postComment}', [CommunityController::class, 'destroyComment'])->name('community.comment.destroy');
    });

    // Moderation — admins + moderators only. Explicit `:id` binding because
    // the community post model's default route key is the slug, but mod
    // UIs work off post.id for compactness.
    Route::middleware('moderator')->prefix('mod')->name('mod.')->group(function () {
        Route::get('/queue', [\App\Http\Controllers\ModerationController::class, 'queue'])->name('queue');
        Route::post('/posts/{post:id}/hide', [\App\Http\Controllers\ModerationController::class, 'hidePost'])->name('posts.hide');
        Route::post('/posts/{post:id}/unhide', [\App\Http\Controllers\ModerationController::class, 'unhidePost'])->name('posts.unhide');
        Route::post('/posts/{post:id}/lock', [\App\Http\Controllers\ModerationController::class, 'lockPost'])->name('posts.lock');
        Route::post('/posts/{post:id}/unlock', [\App\Http\Controllers\ModerationController::class, 'unlockPost'])->name('posts.unlock');
        Route::post('/posts/{post:id}/pin', [\App\Http\Controllers\ModerationController::class, 'pinPost'])->name('posts.pin');
        Route::post('/posts/{post:id}/unpin', [\App\Http\Controllers\ModerationController::class, 'unpinPost'])->name('posts.unpin');
        Route::post('/comments/{comment}/hide', [\App\Http\Controllers\ModerationController::class, 'hideComment'])->name('comments.hide');
        Route::post('/comments/{comment}/unhide', [\App\Http\Controllers\ModerationController::class, 'unhideComment'])->name('comments.unhide');
        Route::post('/lfg/{lfgPost:id}/hide', [\App\Http\Controllers\ModerationController::class, 'hideLfg'])->name('lfg.hide');
        Route::post('/lfg/{lfgPost:id}/unhide', [\App\Http\Controllers\ModerationController::class, 'unhideLfg'])->name('lfg.unhide');
        Route::post('/lfg/{lfgPost:id}/close', [\App\Http\Controllers\ModerationController::class, 'closeLfg'])->name('lfg.close');
    });

    // Player rating (friends)
    Route::post('/player/rate', [PlayerController::class, 'rate'])->middleware('throttle:30,1')->name('player.rate');

    // Block & Report
    Route::post('/block', [BlockController::class, 'store'])->middleware('throttle:10,1')->name('block.store');
    Route::delete('/block/{user}', [BlockController::class, 'destroy'])->middleware('throttle:10,1')->name('block.destroy');
    Route::post('/report', [ReportController::class, 'store'])->middleware('throttle:5,1')->name('report.store');
    Route::get('/my-reports', [ReportController::class, 'mine'])->name('reports.mine');

    // Floating chat widget endpoints — gated by `chat` feature flag.
    Route::middleware('feature:chat')->group(function () {
        Route::get('/chat/friends', [ChatController::class, 'friends'])->name('chat.friends');
        Route::get('/chat/{playerMatch}/messages', [ChatController::class, 'messages'])->name('chat.messages');
        Route::get('/chat/lfg-groups', [LfgController::class, 'myGroups'])->name('chat.lfgGroups');
        Route::get('/chat/lfg/{lfgPost}/messages', [LfgController::class, 'widgetMessages'])->name('chat.lfgMessages');
        Route::delete('/chat/lfg/{lfgPost}/leave', [LfgController::class, 'leaveGroup'])->name('chat.lfgLeave');
        Route::post('/chat/lfg/bulk-leave', [LfgController::class, 'bulkLeaveGroups'])->middleware('throttle:10,1')->name('chat.lfgBulkLeave');
        Route::post('/chat/bulk-hide', [ChatController::class, 'bulkHide'])->middleware('throttle:10,1')->name('chat.bulkHide');
    });

    // Discovery (requires complete profile)
    Route::middleware('profile.complete')->group(function () {
        // Discovery / likes gated by `discovery` feature flag.
        Route::middleware('feature:discovery')->group(function () {
            Route::get('/discover', [DiscoveryController::class, 'index'])->name('discovery.index');
            Route::get('/discover/passed', [DiscoveryController::class, 'passed'])->name('discovery.passed');
            Route::get('/discover/liked-you', [DiscoveryController::class, 'likedYou'])->name('discovery.likedYou');
            Route::post('/discover/undo', [DiscoveryController::class, 'undo'])->name('discovery.undo');
            Route::delete('/discover/pass/{user}', [DiscoveryController::class, 'removePass'])->middleware('throttle:30,1')->name('discovery.removePass');
            Route::post('/likes', [LikeController::class, 'store'])->middleware('throttle:30,1')->name('likes.store');
            Route::post('/likes/pass', [LikeController::class, 'pass'])->middleware('throttle:30,1')->name('likes.pass');
        });
        Route::get('/friends', [MatchController::class, 'index'])->name('friends.index');
        Route::middleware('feature:chat')->group(function () {
            Route::get('/friends/{playerMatch}/chat', [ChatController::class, 'show'])->name('chat.show');
            Route::post('/friends/{playerMatch}/messages', [ChatController::class, 'store'])->middleware('throttle:60,1')->name('chat.store');
            Route::post('/friends/{playerMatch}/read', [ChatController::class, 'markRead'])->middleware('throttle:60,1')->name('chat.markRead');
            Route::get('/friends/{playerMatch}/poll', [ChatController::class, 'poll'])->name('chat.poll');
            Route::delete('/friends/{playerMatch}/hide', [ChatController::class, 'hide'])->middleware('throttle:30,1')->name('chat.hide');
        });

        // LFG (all LFG endpoints behind the `lfg` flag)
        Route::middleware('feature:lfg')->group(function () {
        Route::get('/lfg', [LfgController::class, 'index'])->name('lfg.index');
        Route::get('/lfg/create', [LfgController::class, 'create'])->name('lfg.create');
        Route::post('/lfg', [LfgController::class, 'store'])->middleware('throttle:3,1')->name('lfg.store');
        Route::get('/lfg/{lfgPost}', [LfgController::class, 'show'])->name('lfg.show');
        Route::get('/lfg/{lfgPost}/edit', [LfgController::class, 'edit'])->name('lfg.edit');
        Route::put('/lfg/{lfgPost}', [LfgController::class, 'update'])->name('lfg.update');
        Route::post('/lfg/{lfgPost}/respond', [LfgController::class, 'respond'])->name('lfg.respond');
        Route::delete('/lfg/{lfgPost}/respond', [LfgController::class, 'withdraw'])->name('lfg.withdraw');
        Route::post('/lfg/{lfgPost}/accept/{response}', [LfgController::class, 'acceptResponse'])->name('lfg.accept');
        Route::post('/lfg/{lfgPost}/reject/{response}', [LfgController::class, 'rejectResponse'])->name('lfg.reject');
        Route::post('/lfg/{lfgPost}/message', [LfgController::class, 'sendMessage'])->middleware('throttle:60,1')->name('lfg.message');
        Route::get('/lfg/{lfgPost}/poll', [LfgController::class, 'pollMessages'])->name('lfg.poll');
        Route::post('/lfg/{lfgPost}/rate', [LfgController::class, 'rate'])->name('lfg.rate');
        Route::post('/lfg/{lfgPost}/close', [LfgController::class, 'close'])->name('lfg.close');
        Route::post('/lfg/{lfgPost}/repost', [LfgController::class, 'repost'])->name('lfg.repost');
        Route::delete('/lfg/{lfgPost}', [LfgController::class, 'destroy'])->name('lfg.destroy');

        // Favourite hosts — watch specific hosts and get pinged when they post.
        Route::post('/favorites/{user}', [\App\Http\Controllers\FavoriteHostController::class, 'store'])->middleware('throttle:30,1')->name('favorites.store');
        Route::delete('/favorites/{user}', [\App\Http\Controllers\FavoriteHostController::class, 'destroy'])->name('favorites.destroy');
        }); // end feature:lfg
    });
});

Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

// Admin Panel
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\AdminController::class, 'dashboard'])->name('admin.dashboard');
    Route::get('/users', [\App\Http\Controllers\Admin\AdminController::class, 'users'])->name('admin.users');
    Route::get('/users/{user}', [\App\Http\Controllers\Admin\AdminController::class, 'showUser'])->name('admin.users.show');
    Route::post('/users/{user}/ban', [\App\Http\Controllers\Admin\AdminController::class, 'banUser'])->name('admin.ban');
    Route::post('/users/{user}/unban', [\App\Http\Controllers\Admin\AdminController::class, 'unbanUser'])->name('admin.unban');
    Route::post('/users/{user}/impersonate', [\App\Http\Controllers\Admin\ImpersonationController::class, 'start'])->name('admin.impersonate');
    Route::post('/users/{user}/moderator', [\App\Http\Controllers\Admin\AdminController::class, 'setModerator'])->name('admin.setModerator');
    Route::post('/users/{user}/admin', [\App\Http\Controllers\Admin\AdminController::class, 'setAdmin'])->name('admin.setAdmin');
    Route::get('/reports', [\App\Http\Controllers\Admin\AdminController::class, 'reports'])->name('admin.reports');
    Route::post('/reports/{report}/resolve', [\App\Http\Controllers\Admin\AdminController::class, 'resolveReport'])->name('admin.resolveReport');
    // LfgPost's model uses `slug` as its route key for public URLs. Admin
    // tooling passes integer ids (from the reports table), so bind by id
    // explicitly here to avoid a 404 on `/admin/lfg-posts/42`.
    Route::delete('/lfg-posts/{lfgPost:id}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteLfgPost'])->name('admin.deleteLfgPost');
    Route::get('/games', [\App\Http\Controllers\Admin\AdminController::class, 'games'])->name('admin.games');
    Route::post('/games', [\App\Http\Controllers\Admin\AdminController::class, 'storeGame'])->name('admin.storeGame');
    Route::delete('/games/{game}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteGame'])->name('admin.deleteGame');

    // Changelog
    Route::get('/changelog', [\App\Http\Controllers\Admin\ChangelogController::class, 'index'])->name('admin.changelog.index');
    Route::get('/changelog/create', [\App\Http\Controllers\Admin\ChangelogController::class, 'create'])->name('admin.changelog.create');
    Route::post('/changelog', [\App\Http\Controllers\Admin\ChangelogController::class, 'store'])->name('admin.changelog.store');
    Route::get('/changelog/{entry}/edit', [\App\Http\Controllers\Admin\ChangelogController::class, 'edit'])->name('admin.changelog.edit');
    Route::put('/changelog/{entry}', [\App\Http\Controllers\Admin\ChangelogController::class, 'update'])->name('admin.changelog.update');
    Route::delete('/changelog/{entry}', [\App\Http\Controllers\Admin\ChangelogController::class, 'destroy'])->name('admin.changelog.destroy');

    // Audit log (immutable record of admin actions touching user accounts)
    Route::get('/audit', [\App\Http\Controllers\Admin\AuditController::class, 'index'])->name('admin.audit');

    // System (maintenance, feature flags, flash bar)
    Route::get('/system', [\App\Http\Controllers\Admin\SystemController::class, 'show'])->name('admin.system');
    Route::post('/system/maintenance', [\App\Http\Controllers\Admin\SystemController::class, 'toggleMaintenance'])->name('admin.system.maintenance');
    Route::post('/system/features', [\App\Http\Controllers\Admin\SystemController::class, 'updateFeatures'])->name('admin.system.features');
    Route::post('/system/flash', [\App\Http\Controllers\Admin\SystemController::class, 'updateFlash'])->name('admin.system.flash');
    Route::post('/users/{user}/kill', [\App\Http\Controllers\Admin\SystemController::class, 'killUser'])->name('admin.system.kill');

    // Broadcasts
    Route::get('/broadcasts', [\App\Http\Controllers\Admin\BroadcastController::class, 'index'])->name('admin.broadcasts.index');
    Route::get('/broadcasts/analytics', [\App\Http\Controllers\Admin\BroadcastController::class, 'analytics'])->name('admin.broadcasts.analytics');
    Route::get('/broadcasts/diagnostics', [\App\Http\Controllers\Admin\BroadcastController::class, 'diagnostics'])->name('admin.broadcasts.diagnostics');
    Route::post('/broadcasts/diagnostics/run', [\App\Http\Controllers\Admin\BroadcastController::class, 'runScheduler'])->middleware('throttle:6,1')->name('admin.broadcasts.diagnostics.run');
    Route::get('/broadcasts/create', [\App\Http\Controllers\Admin\BroadcastController::class, 'create'])->name('admin.broadcasts.create');
    Route::post('/broadcasts', [\App\Http\Controllers\Admin\BroadcastController::class, 'store'])->name('admin.broadcasts.store');
    Route::post('/broadcasts/preview', [\App\Http\Controllers\Admin\BroadcastController::class, 'preview'])->name('admin.broadcasts.preview');
    Route::get('/broadcasts/{broadcast}/edit', [\App\Http\Controllers\Admin\BroadcastController::class, 'edit'])->name('admin.broadcasts.edit');
    Route::put('/broadcasts/{broadcast}', [\App\Http\Controllers\Admin\BroadcastController::class, 'update'])->name('admin.broadcasts.update');
    Route::post('/broadcasts/{broadcast}/send', [\App\Http\Controllers\Admin\BroadcastController::class, 'send'])->name('admin.broadcasts.send');
    Route::post('/broadcasts/{broadcast}/test', [\App\Http\Controllers\Admin\BroadcastController::class, 'sendTest'])->middleware('throttle:10,1')->name('admin.broadcasts.test');
    Route::delete('/broadcasts/{broadcast}', [\App\Http\Controllers\Admin\BroadcastController::class, 'destroy'])->name('admin.broadcasts.destroy');
});

require __DIR__.'/auth.php';
