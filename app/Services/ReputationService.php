<?php

namespace App\Services;

use App\Models\LfgRating;
use App\Models\User;

class ReputationService
{
    public function calculate(User $user): float
    {
        $ratings = LfgRating::where('rated_id', $user->id);
        $count = $ratings->count();

        if ($count === 0) {
            return 0;
        }

        $avg = $ratings->avg('score');

        // Weight: more ratings = score converges to true average
        // With fewer ratings, pull toward neutral (3.0)
        $weight = min($count / 10, 1.0); // Full weight at 10+ ratings
        $weighted = ($avg * $weight) + (3.0 * (1 - $weight));

        $score = round($weighted, 1);

        // Update profile
        if ($user->profile) {
            $user->profile->update(['reputation_score' => $score]);
        }

        return $score;
    }
}
