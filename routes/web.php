<?php

use App\Http\Controllers\AvatarController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DiscoveryController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\GameProfileController;
use App\Http\Controllers\GamesController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/privacy-policy', fn () => Inertia::render('Legal/PrivacyPolicy'))->name('legal.privacy');
Route::get('/terms-of-service', fn () => Inertia::render('Legal/TermsOfService'))->name('legal.terms');
Route::get('/cookie-policy', fn () => Inertia::render('Legal/CookiePolicy'))->name('legal.cookies');

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
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
                'partner' => $match->user_one_id === $user->id ? $match->userTwo : $match->userOne,
                'created_at' => $match->created_at,
            ];
        });

    $allGames = \App\Models\Game::all();

    return Inertia::render('Dashboard', [
        'matchCount' => $matchCount,
        'recentMatches' => $recentMatches,
        'allGames' => $allGames,
    ]);
})->middleware(['auth', 'verified', 'profile.complete'])->name('dashboard');

// Public
Route::get('/games', [GamesController::class, 'index'])->name('games.index');
Route::get('/player/{username}', [PlayerController::class, 'show'])->name('player.show');
Route::get('/players', [\App\Http\Controllers\DiscoveryController::class, 'publicIndex'])->name('players.public');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Avatar
    Route::post('/avatar/upload', [AvatarController::class, 'upload'])->name('avatar.upload');
    Route::post('/avatar/preset', [AvatarController::class, 'setPreset'])->name('avatar.preset');

    // Game Profile
    Route::get('/profile/me', [GameProfileController::class, 'show'])->name('game-profile.show');
    Route::get('/profile/setup', [GameProfileController::class, 'edit'])->name('game-profile.edit');
    Route::put('/profile/setup', [GameProfileController::class, 'update'])->name('game-profile.update');

    // Discovery (requires complete profile)
    Route::middleware('profile.complete')->group(function () {
        Route::get('/players', [DiscoveryController::class, 'index'])->name('discovery.index');
        Route::post('/likes', [LikeController::class, 'store'])->name('likes.store');
        Route::post('/likes/pass', [LikeController::class, 'pass'])->name('likes.pass');
        Route::get('/matches', [MatchController::class, 'index'])->name('matches.index');
        Route::get('/matches/{match}/chat', [ChatController::class, 'show'])->name('chat.show');
        Route::post('/matches/{match}/messages', [ChatController::class, 'store'])->name('chat.store');
    });
});

require __DIR__.'/auth.php';
