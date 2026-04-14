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

Route::get('/privacy-policy', fn () => Inertia::render('Legal/PrivacyPolicy'))->name('legal.privacy');
Route::get('/terms-of-service', fn () => Inertia::render('Legal/TermsOfService'))->name('legal.terms');
Route::get('/cookie-policy', fn () => Inertia::render('Legal/CookiePolicy'))->name('legal.cookies');

Route::get('/', function () {
    $totalPlayers = Cache::remember('home:players', 300, fn () => \App\Models\User::whereHas('profile')->count());
    $totalGames = Cache::remember('home:games', 300, fn () => \App\Models\Game::count());
    $activeLfg = Cache::remember('home:lfg', 300, fn () => \App\Models\LfgPost::where('status', 'open')->count());
    $topGames = Cache::remember('home:topgames', 300, fn () => \App\Models\Game::withCount('users')->orderByDesc('users_count')->take(8)->get()->toArray());
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

    $allGames = \App\Models\Game::withCount('users')->get();

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

    // Platform stats
    $totalPlayers = \App\Models\User::whereHas('profile')->count();
    $newPlayersToday = \App\Models\User::whereHas('profile')->whereDate('created_at', today())->count();
    $onlineRecent = \App\Models\User::where('updated_at', '>=', now()->subMinutes(15))->count();

    // Trending games (most new user_games in last 7 days)
    $trendingGameIds = \App\Models\UserGame::where('created_at', '>=', now()->subDays(7))
        ->select('game_id')
        ->selectRaw('count(*) as cnt')
        ->groupBy('game_id')
        ->orderByDesc('cnt')
        ->take(5)
        ->pluck('game_id');
    $trendingGames = \App\Models\Game::whereIn('id', $trendingGameIds)->withCount('users')->get();

    // Activity feed: recent profiles created + recent friends made
    $recentProfiles = \App\Models\Profile::with('user')
        ->latest()
        ->take(5)
        ->get()
        ->map(fn ($p) => [
            'type' => 'joined',
            'username' => $p->username,
            'avatar' => $p->avatar,
            'time' => $p->created_at->diffForHumans(),
        ]);

    $recentFriendships = \App\Models\PlayerMatch::with(['userOne.profile', 'userTwo.profile'])
        ->latest()
        ->take(5)
        ->get()
        ->map(fn ($m) => [
            'type' => 'friends',
            'user1' => $m->userOne->profile?->username ?? $m->userOne->name,
            'user2' => $m->userTwo->profile?->username ?? $m->userTwo->name,
            'time' => $m->created_at->diffForHumans(),
        ]);

    $activityFeed = $recentProfiles->merge($recentFriendships)
        ->sortByDesc('time')
        ->take(8)
        ->values();

    $relevantLfg = $userGameIds->isNotEmpty()
        ? \App\Models\LfgPost::open()
            ->whereIn('game_id', $userGameIds)
            ->with(['user.profile', 'game'])
            ->latest()
            ->take(3)
            ->get()
        : collect();

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
    ]);
})->middleware(['auth', 'verified', 'age.verified', 'profile.complete'])->name('dashboard');

// Public
Route::get('/games', [GamesController::class, 'index'])->name('games.index');
Route::get('/player/{username}', [PlayerController::class, 'show'])->name('player.show');
Route::get('/clips', [ClipController::class, 'index'])->name('clips.index');
Route::get('/redirect', [\App\Http\Controllers\RedirectController::class, 'redirect'])->name('external.redirect');
Route::get('/search', [SearchController::class, 'search'])->middleware('auth')->name('search');

// Community (public viewing)
Route::get('/community', [CommunityController::class, 'index'])->name('community.index');
Route::get('/community/create', [CommunityController::class, 'create'])->middleware('auth')->name('community.create');
Route::get('/community/{communityPost}', [CommunityController::class, 'show'])->name('community.show');

Route::middleware('auth')->group(function () {
    // Notifications
    Route::get('/notifications/poll', [\App\Http\Controllers\NotificationController::class, 'poll'])->name('notifications.poll');
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllRead'])->name('notifications.readAll');
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markRead'])->name('notifications.markRead');

    // Age verification (for Google OAuth users who skipped registration form)
    Route::get('/verify-age', [\App\Http\Controllers\Auth\AgeVerificationController::class, 'show'])->name('age-verification');
    Route::post('/verify-age', [\App\Http\Controllers\Auth\AgeVerificationController::class, 'store'])->name('age-verification.store');

    Route::get('/players', [\App\Http\Controllers\DiscoveryController::class, 'publicIndex'])->name('players.public');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Clips
    Route::post('/clips', [ClipController::class, 'store'])->middleware('throttle:10,1')->name('clips.store');
    Route::delete('/clips/{clip}', [ClipController::class, 'destroy'])->name('clips.destroy');

    // Avatar
    Route::post('/avatar/upload', [AvatarController::class, 'upload'])->middleware('throttle:10,1')->name('avatar.upload');
    Route::post('/avatar/preset', [AvatarController::class, 'setPreset'])->name('avatar.preset');

    // Game Profile
    Route::get('/profile/me', [GameProfileController::class, 'show'])->name('game-profile.show');
    Route::get('/profile/setup', [GameProfileController::class, 'edit'])->name('game-profile.edit');
    Route::put('/profile/setup', [GameProfileController::class, 'update'])->name('game-profile.update');

    // Achievements
    Route::get('/achievements', [AchievementController::class, 'index'])->name('achievements.index');

    // Community (auth actions)
    Route::post('/community', [CommunityController::class, 'store'])->middleware('throttle:10,1')->name('community.store');
    Route::post('/community/{communityPost}/vote', [CommunityController::class, 'vote'])->name('community.vote');
    Route::post('/community/{communityPost}/comment', [CommunityController::class, 'comment'])->name('community.comment');
    Route::delete('/community/comment/{postComment}', [CommunityController::class, 'destroyComment'])->name('community.comment.destroy');

    // Block & Report
    Route::post('/block', [BlockController::class, 'store'])->middleware('throttle:10,1')->name('block.store');
    Route::delete('/block/{user}', [BlockController::class, 'destroy'])->middleware('throttle:10,1')->name('block.destroy');
    Route::post('/report', [ReportController::class, 'store'])->middleware('throttle:5,1')->name('report.store');

    // Discovery (requires complete profile)
    Route::middleware('profile.complete')->group(function () {
        Route::get('/discover', [DiscoveryController::class, 'index'])->name('discovery.index');
        Route::get('/discover/passed', [DiscoveryController::class, 'passed'])->name('discovery.passed');
        Route::get('/discover/liked-you', [DiscoveryController::class, 'likedYou'])->name('discovery.likedYou');
        Route::post('/discover/undo', [DiscoveryController::class, 'undo'])->name('discovery.undo');
        Route::delete('/discover/pass/{user}', [DiscoveryController::class, 'removePass'])->name('discovery.removePass');
        Route::post('/likes', [LikeController::class, 'store'])->middleware('throttle:30,1')->name('likes.store');
        Route::post('/likes/pass', [LikeController::class, 'pass'])->middleware('throttle:30,1')->name('likes.pass');
        Route::get('/friends', [MatchController::class, 'index'])->name('friends.index');
        Route::get('/friends/{playerMatch}/chat', [ChatController::class, 'show'])->name('chat.show');
        Route::post('/friends/{playerMatch}/messages', [ChatController::class, 'store'])->middleware('throttle:60,1')->name('chat.store');
        Route::post('/friends/{playerMatch}/read', [ChatController::class, 'markRead'])->name('chat.markRead');
        Route::get('/friends/{playerMatch}/poll', [ChatController::class, 'poll'])->name('chat.poll');

        // LFG
        Route::get('/lfg', [LfgController::class, 'index'])->name('lfg.index');
        Route::get('/lfg/create', [LfgController::class, 'create'])->name('lfg.create');
        Route::post('/lfg', [LfgController::class, 'store'])->name('lfg.store');
        Route::get('/lfg/{lfgPost}', [LfgController::class, 'show'])->name('lfg.show');
        Route::get('/lfg/{lfgPost}/edit', [LfgController::class, 'edit'])->name('lfg.edit');
        Route::put('/lfg/{lfgPost}', [LfgController::class, 'update'])->name('lfg.update');
        Route::post('/lfg/{lfgPost}/respond', [LfgController::class, 'respond'])->name('lfg.respond');
        Route::post('/lfg/{lfgPost}/accept/{response}', [LfgController::class, 'acceptResponse'])->name('lfg.accept');
        Route::post('/lfg/{lfgPost}/reject/{response}', [LfgController::class, 'rejectResponse'])->name('lfg.reject');
        Route::post('/lfg/{lfgPost}/message', [LfgController::class, 'sendMessage'])->name('lfg.message');
        Route::get('/lfg/{lfgPost}/poll', [LfgController::class, 'pollMessages'])->name('lfg.poll');
        Route::post('/lfg/{lfgPost}/rate', [LfgController::class, 'rate'])->name('lfg.rate');
        Route::post('/lfg/{lfgPost}/close', [LfgController::class, 'close'])->name('lfg.close');
        Route::post('/lfg/{lfgPost}/repost', [LfgController::class, 'repost'])->name('lfg.repost');
    });
});

Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

// Admin Panel
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::get('/', [\App\Http\Controllers\Admin\AdminController::class, 'dashboard'])->name('admin.dashboard');
    Route::get('/users', [\App\Http\Controllers\Admin\AdminController::class, 'users'])->name('admin.users');
    Route::post('/users/{user}/ban', [\App\Http\Controllers\Admin\AdminController::class, 'banUser'])->name('admin.ban');
    Route::get('/reports', [\App\Http\Controllers\Admin\AdminController::class, 'reports'])->name('admin.reports');
    Route::post('/reports/{report}/resolve', [\App\Http\Controllers\Admin\AdminController::class, 'resolveReport'])->name('admin.resolveReport');
    Route::get('/games', [\App\Http\Controllers\Admin\AdminController::class, 'games'])->name('admin.games');
    Route::post('/games', [\App\Http\Controllers\Admin\AdminController::class, 'storeGame'])->name('admin.storeGame');
    Route::delete('/games/{game}', [\App\Http\Controllers\Admin\AdminController::class, 'deleteGame'])->name('admin.deleteGame');
});

require __DIR__.'/auth.php';
