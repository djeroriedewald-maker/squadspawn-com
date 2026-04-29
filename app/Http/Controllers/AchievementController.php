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

        app(AchievementService::class)->check($user);

        $achievements = Achievement::all();
        $earnedIds = UserAchievement::where('user_id', $user->id)->pluck('achievement_id')->toArray();
        $earnedDates = UserAchievement::where('user_id', $user->id)->pluck('created_at', 'achievement_id')->toArray();

        $totalPoints = $achievements->sum('points');
        $earnedPoints = $achievements->whereIn('id', $earnedIds)->sum('points');

        // Progress calculations
        $friendCount = PlayerMatch::where('user_one_id', $user->id)->orWhere('user_two_id', $user->id)->count();
        $lfgHosted = LfgPost::where('user_id', $user->id)->count();
        $lfgJoined = LfgResponse::where('user_id', $user->id)->where('status', 'accepted')->count();
        $completedSessions = LfgPost::where('status', 'closed')->where(function ($q) use ($user) {
            $q->where('user_id', $user->id)->orWhereHas('responses', fn ($r) => $r->where('user_id', $user->id)->where('status', 'accepted'));
        })->count();
        $acceptedOthers = LfgResponse::whereHas('lfgPost', fn ($q) => $q->where('user_id', $user->id))->where('status', 'accepted')->count();
        $clipCount = Clip::where('user_id', $user->id)->count();
        $gameCount = $user->games->count();
        $messageCount = Message::where('sender_id', $user->id)->count();
        $ratingsGiven = LfgRating::where('rater_id', $user->id)->count();
        $ratingCount = LfgRating::where('rated_id', $user->id)->count();
        $avgRating = $ratingCount > 0 ? round(LfgRating::where('rated_id', $user->id)->avg('score'), 1) : 0;
        $hasBio = !empty($user->profile?->bio);
        $hasAvatar = !empty($user->profile?->avatar);
        $hasSocial = is_array($user->profile?->socials) && count(array_filter($user->profile->socials)) >= 1;
        $toxicTags = $ratingCount >= 25 ? LfgRating::where('rated_id', $user->id)->where(function ($q) { $q->where('tag', 'like', '%toxic%')->orWhere('tag', 'like', '%no_show%'); })->count() : -1;

        $regionCount = 0;
        try {
            $regionCount = PlayerMatch::where(function ($q) use ($user) { $q->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id); })
                ->with(['userOne.profile', 'userTwo.profile'])->get()
                ->map(fn ($m) => ($m->user_one_id === $user->id ? $m->userTwo : $m->userOne)->profile?->region)
                ->filter()->unique()->count();
        } catch (\Throwable) {}

        $progress = [
            'first-friend' => ['current' => $friendCount, 'target' => 1, 'label' => 'friends'],
            'social-butterfly' => ['current' => $friendCount, 'target' => 10, 'label' => 'friends'],
            'popular' => ['current' => $friendCount, 'target' => 50, 'label' => 'friends'],
            'squad-leader' => ['current' => $lfgHosted, 'target' => 5, 'label' => 'LFGs hosted'],
            'mentor' => ['current' => $lfgHosted, 'target' => 20, 'label' => 'LFGs hosted'],
            'squad-goals' => ['current' => $completedSessions, 'target' => 5, 'label' => 'sessions completed'],
            'team-player' => ['current' => $lfgJoined, 'target' => 10, 'label' => 'groups joined'],
            'recruiter' => ['current' => $acceptedOthers, 'target' => 25, 'label' => 'players accepted'],
            'content-creator' => ['current' => $clipCount, 'target' => 5, 'label' => 'clips'],
            'clip-king' => ['current' => $clipCount, 'target' => 20, 'label' => 'clips'],
            'game-collector' => ['current' => $gameCount, 'target' => 5, 'label' => 'games'],
            'conversation-starter' => ['current' => $messageCount, 'target' => 50, 'label' => 'messages'],
            'chatterbox' => ['current' => $messageCount, 'target' => 500, 'label' => 'messages'],
            'early-adopter' => ['current' => 1, 'target' => 1, 'label' => 'joined early'],
            'first-blood' => ['current' => $ratingsGiven, 'target' => 1, 'label' => 'ratings given'],
            'trusted-player' => ['current' => $ratingCount, 'target' => 10, 'label' => 'ratings received'],
            'top-rated' => ['current' => $ratingCount >= 3 ? $avgRating : 0, 'target' => 4.5, 'label' => "avg rating ({$ratingCount}/3 min)"],
            'all-star' => ['current' => $ratingCount >= 20 ? $avgRating : 0, 'target' => 4.5, 'label' => "avg rating ({$ratingCount}/20 min)"],
            'no-toxic' => ['current' => $ratingCount >= 25 ? ($toxicTags === 0 ? 25 : 25 - $toxicTags) : $ratingCount, 'target' => 25, 'label' => 'clean ratings'],
            'globe-trotter' => ['current' => $regionCount, 'target' => 5, 'label' => 'regions'],
            'profile-complete' => ['current' => ($hasBio ? 1 : 0) + ($hasAvatar ? 1 : 0) + ($hasSocial ? 1 : 0), 'target' => 3, 'label' => 'steps'],
            'hall-of-famer' => ['current' => $ratingCount >= 100 ? $avgRating : 0, 'target' => 4.7, 'label' => "avg rating ({$ratingCount}/100 min)"],
            'pillar-of-the-community' => ['current' => $lfgHosted, 'target' => 50, 'label' => 'LFGs hosted'],
            'living-legend' => ['current' => ($user->profile?->level ?? 1), 'target' => 6, 'label' => 'reach Legend'],
        ];

        // XP Level
        $userXp = $user->profile?->xp ?? 0;
        $levels = AchievementService::LEVELS;
        $currentLevel = $levels[1];
        $currentLevelNum = 1;
        $nextLevel = $levels[2] ?? null;
        $nextLevelNum = 2;

        foreach ($levels as $lvl => $data) {
            if ($userXp >= $data['xp']) {
                $currentLevel = $data;
                $currentLevelNum = $lvl;
                $nextLevel = $levels[$lvl + 1] ?? null;
                $nextLevelNum = $lvl + 1;
            }
        }

        return Inertia::render('Achievements/Index', [
            'achievements' => $achievements,
            'earnedIds' => $earnedIds,
            'earnedDates' => $earnedDates,
            'totalPoints' => $totalPoints,
            'earnedPoints' => $earnedPoints,
            'progress' => $progress,
            'userXp' => $userXp,
            'currentLevel' => array_merge($currentLevel, ['level' => $currentLevelNum]),
            'nextLevel' => $nextLevel ? array_merge($nextLevel, ['level' => $nextLevelNum]) : null,
            'levels' => collect($levels)->map(fn ($l, $k) => array_merge($l, ['level' => $k]))->values(),
            // Legend gates surface only once the user is close (Champion+
            // or has crossed the XP bar but not the gates). Below that the
            // panel just adds noise. Computed eagerly because the queries
            // are bounded — at most 50-100 ratings + a count.
            'legendGates' => ($currentLevelNum >= 5 || $userXp >= AchievementService::LEVELS[6]['xp'])
                ? AchievementService::legendGates($user)
                : null,
            'seo' => [
                'title' => 'Achievements & Levels · SquadSpawn',
                'description' => 'Earn achievements for hosting LFGs, building reputation, and squadding up. Unlock levels from Recruit to Legend — every action counts toward your XP and permanent badges.',
                'image' => url('/images/achievements/_tier-platinum.jpg'),
                'keywords' => 'gaming achievements, gamer levels, gaming XP, LFG achievements, gamer reputation system, SquadSpawn levels',
            ],
        ]);
    }
}
