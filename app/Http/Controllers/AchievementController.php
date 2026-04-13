<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\UserAchievement;
use App\Services\AchievementService;
use Inertia\Inertia;
use Inertia\Response;

class AchievementController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

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

        return Inertia::render('Achievements/Index', [
            'achievements' => $achievements,
            'earnedIds' => $earnedIds,
            'earnedDates' => $earnedDates,
            'totalPoints' => $totalPoints,
            'earnedPoints' => $earnedPoints,
        ]);
    }
}
