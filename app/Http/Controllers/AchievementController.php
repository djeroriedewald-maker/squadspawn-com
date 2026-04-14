<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\Clip;
use App\Models\LfgPost;
use App\Models\LfgRating;
use App\Models\LfgResponse;
use App\Models\Message;
use App\Models\PlayerMatch;
use App\Models\UserAchievement;
use App\Services\AchievementService;
use Inertia\Inertia;
use Inertia\Response;

class AchievementController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $user->load(['profile', 'games']);

        // Trigger a check so achievements are up to date
        app(AchievementService::class)->check($user);

        $achievements = Achievement::all();
        $earnedIds = UserAchievement::where('user_id', $user->id)
            ->pluck('achievement_id')
            ->toArray();

        $earnedDates = UserAchievement::where('user_id', $user->id)
            ->pluck('created_at', 'achievement_id')
            ->toArray();

        $totalPoints = $achievements->sum('points');
        $earnedPoints = $achievements->whereIn('id', $earnedIds)->sum('points');

        // Calculate progress for each achievement
        $friendCount = PlayerMatch::where('user_one_id', $user->id)->orWhere('user_two_id', $user->id)->count();
        $lfgHosted = LfgPost::where('user_id', $user->id)->count();
        $lfgJoined = LfgResponse::where('user_id', $user->id)->where('status', 'accepted')->count();
        $clipCount = Clip::where('user_id', $user->id)->count();
        $gameCount = $user->games->count();
        $messageCount = Message::where('sender_id', $user->id)->count();
        $ratingCount = LfgRating::where('rated_id', $user->id)->count();
        $avgRating = $ratingCount > 0 ? round(LfgRating::where('rated_id', $user->id)->avg('score'), 1) : 0;
        $hasBio = !empty($user->profile?->bio);
        $hasAvatar = !empty($user->profile?->avatar);
        $hasSocial = is_array($user->profile?->socials) && count(array_filter($user->profile->socials)) >= 1;
        $profileComplete = $hasBio && $hasAvatar && $hasSocial;

        $progress = [
            'first-friend' => ['current' => $friendCount, 'target' => 1, 'label' => 'friends'],
            'social-butterfly' => ['current' => $friendCount, 'target' => 10, 'label' => 'friends'],
            'squad-leader' => ['current' => $lfgHosted, 'target' => 5, 'label' => 'LFGs hosted'],
            'team-player' => ['current' => $lfgJoined, 'target' => 10, 'label' => 'groups joined'],
            'content-creator' => ['current' => $clipCount, 'target' => 5, 'label' => 'clips'],
            'game-collector' => ['current' => $gameCount, 'target' => 5, 'label' => 'games'],
            'conversation-starter' => ['current' => $messageCount, 'target' => 50, 'label' => 'messages sent'],
            'early-adopter' => ['current' => 1, 'target' => 1, 'label' => 'joined early'],
            'top-rated' => ['current' => $ratingCount >= 3 ? $avgRating : 0, 'target' => 4.5, 'label' => "avg rating ({$ratingCount}/3 ratings)"],
            'profile-complete' => ['current' => ($hasBio ? 1 : 0) + ($hasAvatar ? 1 : 0) + ($hasSocial ? 1 : 0), 'target' => 3, 'label' => 'steps done'],
        ];

        // XP Level system based on earned points
        $xpLevels = [
            ['level' => 1, 'name' => 'Rookie', 'xp' => 0],
            ['level' => 2, 'name' => 'Player', 'xp' => 50],
            ['level' => 3, 'name' => 'Veteran', 'xp' => 150],
            ['level' => 4, 'name' => 'Elite', 'xp' => 300],
            ['level' => 5, 'name' => 'Legend', 'xp' => 500],
        ];

        $currentLevel = $xpLevels[0];
        $nextLevel = $xpLevels[1] ?? null;
        foreach ($xpLevels as $i => $lvl) {
            if ($earnedPoints >= $lvl['xp']) {
                $currentLevel = $lvl;
                $nextLevel = $xpLevels[$i + 1] ?? null;
            }
        }

        return Inertia::render('Achievements/Index', [
            'achievements' => $achievements,
            'earnedIds' => $earnedIds,
            'earnedDates' => $earnedDates,
            'totalPoints' => $totalPoints,
            'earnedPoints' => $earnedPoints,
            'progress' => $progress,
            'currentLevel' => $currentLevel,
            'nextLevel' => $nextLevel,
        ]);
    }
}
