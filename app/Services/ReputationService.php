<?php

namespace App\Services;

use App\Models\LfgRating;
use App\Models\PlayerRating;
use App\Models\User;

class ReputationService
{
    private const TAG_MODIFIERS = [
        'great_teammate' => +0.3,
        'good_comms' => +0.2,
        'skilled' => +0.2,
        'friendly' => +0.15,
        'toxic' => -0.5,
        'no_show' => -0.4,
    ];

    public function calculate(User $user): array
    {
        // Combine LFG ratings and player (friend) ratings
        $lfgRatings = LfgRating::where('rated_id', $user->id)->get();

        // Player ratings table may not exist yet (migration pending)
        try {
            $playerRatings = PlayerRating::where('rated_id', $user->id)->get();
        } catch (\Throwable) {
            $playerRatings = collect();
        }

        $allScores = $lfgRatings->pluck('score')->merge($playerRatings->pluck('score'));
        // Tags can be comma-separated (multiple tags per rating)
        $allTags = $lfgRatings->pluck('tag')->merge($playerRatings->pluck('tag'))
            ->filter()
            ->flatMap(fn ($t) => explode(',', $t))
            ->filter()
            ->values();
        $count = $allScores->count();

        if ($count === 0) {
            if ($user->profile) {
                $user->profile->update(['reputation_score' => 0]);
            }
            return ['score' => 0, 'count' => 0, 'top_tag' => null, 'tags' => []];
        }

        $avg = $allScores->avg();

        // Tag modifier
        $tagModifier = 0;
        if ($allTags->isNotEmpty()) {
            $totalMod = 0;
            foreach ($allTags as $tag) {
                $totalMod += self::TAG_MODIFIERS[$tag] ?? 0;
            }
            $tagModifier = $totalMod / $count;
        }

        // Weight: converges to true average quickly
        // 1 rating = 70% real + 30% neutral, 3+ ratings = 100% real
        $weight = min($count / 3, 1.0);
        $weighted = ($avg * $weight) + (3.0 * (1 - $weight));

        $score = round(max(1.0, min(5.0, $weighted + $tagModifier)), 1);

        // Tag counts
        $tagCounts = [];
        foreach ($allTags as $tag) {
            $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
        }
        arsort($tagCounts);

        $topTag = !empty($tagCounts) ? array_key_first($tagCounts) : null;

        if ($user->profile) {
            $user->profile->update(['reputation_score' => $score]);
        }

        return [
            'score' => $score,
            'count' => $count,
            'lfg_count' => $lfgRatings->count(),
            'friend_count' => $playerRatings->count(),
            'top_tag' => $topTag,
            'tags' => $tagCounts,
        ];
    }
}
