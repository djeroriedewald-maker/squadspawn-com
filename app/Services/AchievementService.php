<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\LfgPost;
use App\Models\LfgRating;
use App\Models\LfgResponse;
use App\Models\Message;
use App\Models\PlayerMatch;
use App\Models\User;
use App\Models\UserAchievement;

class AchievementService
{
    public function check(User $user): void
    {
        // Count friends (matches)
        $friendCount = PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->count();

        if ($friendCount >= 1) {
            $this->award($user, 'first-friend');
        }
        if ($friendCount >= 10) {
            $this->award($user, 'social-butterfly');
        }

        // Count LFG posts created
        $lfgPostCount = LfgPost::where('user_id', $user->id)->count();
        if ($lfgPostCount >= 5) {
            $this->award($user, 'squad-leader');
        }

        // Count LFG responses accepted
        $acceptedResponses = LfgResponse::where('user_id', $user->id)
            ->where('status', 'accepted')
            ->count();
        if ($acceptedResponses >= 10) {
            $this->award($user, 'team-player');
        }

        // Count clips
        $clipCount = $user->clips()->count();
        if ($clipCount >= 5) {
            $this->award($user, 'content-creator');
        }

        // Count user games
        $gameCount = $user->games()->count();
        if ($gameCount >= 5) {
            $this->award($user, 'game-collector');
        }

        // Count messages sent
        $messageCount = Message::where('sender_id', $user->id)->count();
        if ($messageCount >= 50) {
            $this->award($user, 'conversation-starter');
        }

        // Early adopter
        if ($user->created_at && $user->created_at->lt('2026-07-01')) {
            $this->award($user, 'early-adopter');
        }

        // Average LFG rating received
        $avgRating = LfgRating::where('rated_id', $user->id)->avg('score');
        $ratingCount = LfgRating::where('rated_id', $user->id)->count();
        if ($ratingCount >= 3 && $avgRating >= 4.5) {
            $this->award($user, 'top-rated');
        }

        // Profile complete
        $profile = $user->profile;
        if ($profile) {
            $hasBio = !empty($profile->bio);
            $hasAvatar = !empty($profile->avatar);
            $hasSocial = is_array($profile->socials) && count(array_filter($profile->socials)) >= 1;

            if ($hasBio && $hasAvatar && $hasSocial) {
                $this->award($user, 'profile-complete');
            }
        }
    }

    public function award(User $user, string $slug): bool
    {
        $achievement = Achievement::where('slug', $slug)->first();
        if (!$achievement) {
            return false;
        }

        // Check if already awarded
        $exists = UserAchievement::where('user_id', $user->id)
            ->where('achievement_id', $achievement->id)
            ->exists();

        if ($exists) {
            return false;
        }

        UserAchievement::create([
            'user_id' => $user->id,
            'achievement_id' => $achievement->id,
        ]);

        // Update achievement_points on profile
        $totalPoints = UserAchievement::where('user_id', $user->id)
            ->join('achievements', 'achievements.id', '=', 'user_achievements.achievement_id')
            ->sum('achievements.points');

        if ($user->profile) {
            $user->profile->update(['achievement_points' => $totalPoints]);
        }

        return true;
    }
}
