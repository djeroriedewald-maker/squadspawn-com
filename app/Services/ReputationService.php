<?php

namespace App\Services;

use App\Models\LfgRating;
use App\Models\User;

class ReputationService
{
    /**
     * Tag modifiers: positive tags boost score, negative tags reduce it.
     */
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
        $ratings = LfgRating::where('rated_id', $user->id)->get();
        $count = $ratings->count();

        if ($count === 0) {
            if ($user->profile) {
                $user->profile->update(['reputation_score' => 0]);
            }
            return [
                'score' => 0,
                'count' => 0,
                'top_tag' => null,
                'tags' => [],
            ];
        }

        // Base average from scores (1-5)
        $avg = $ratings->avg('score');

        // Calculate tag modifier: average of all tag bonuses/penalties
        $tagModifier = 0;
        $taggedRatings = $ratings->whereNotNull('tag')->where('tag', '!=', '');
        if ($taggedRatings->count() > 0) {
            $totalMod = 0;
            foreach ($taggedRatings as $r) {
                $totalMod += self::TAG_MODIFIERS[$r->tag] ?? 0;
            }
            $tagModifier = $totalMod / $count; // Spread across all ratings
        }

        // Weight: more ratings = score converges to true average
        // With fewer ratings, pull toward neutral (3.0)
        $weight = min($count / 10, 1.0);
        $weighted = ($avg * $weight) + (3.0 * (1 - $weight));

        // Apply tag modifier (clamped to 1.0-5.0 range)
        $score = round(max(1.0, min(5.0, $weighted + $tagModifier)), 1);

        // Count tags for breakdown
        $tagCounts = [];
        foreach ($taggedRatings as $r) {
            $tagCounts[$r->tag] = ($tagCounts[$r->tag] ?? 0) + 1;
        }
        arsort($tagCounts);

        $topTag = !empty($tagCounts) ? array_key_first($tagCounts) : null;

        // Update profile
        if ($user->profile) {
            $user->profile->update(['reputation_score' => $score]);
        }

        return [
            'score' => $score,
            'count' => $count,
            'top_tag' => $topTag,
            'tags' => $tagCounts,
        ];
    }
}
