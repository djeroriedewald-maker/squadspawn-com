<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Clip;
use App\Models\LfgPost;
use App\Models\LfgRating;
use App\Models\LfgResponse;
use App\Models\Message;
use App\Models\PlayerMatch;
use App\Models\User;
use App\Models\UserAchievement;

class AchievementService
{
    /**
     * XP Level thresholds.
     */
    public const LEVELS = [
        1 => ['name' => 'Rookie', 'xp' => 0],
        2 => ['name' => 'Player', 'xp' => 100],
        3 => ['name' => 'Veteran', 'xp' => 500],
        4 => ['name' => 'Elite', 'xp' => 1500],
        5 => ['name' => 'Champion', 'xp' => 3000],
        6 => ['name' => 'Legend', 'xp' => 5000],
    ];

    /**
     * XP rewards for actions (called from controllers).
     */
    public static function awardXp(User $user, string $action): void
    {
        $xpMap = [
            'daily_login' => 5,
            'message_sent' => 1,     // max 10/day enforced by caller
            'lfg_hosted' => 20,
            'lfg_joined' => 10,
            'rating_given' => 5,
            'rating_received_5star' => 15,
            'new_friend' => 10,
            'clip_shared' => 5,
        ];

        $xp = $xpMap[$action] ?? 0;
        if ($xp === 0 || !$user->profile) return;

        $user->profile->increment('xp', $xp);

        // Recalculate level
        $totalXp = $user->profile->xp;
        $level = 1;
        foreach (self::LEVELS as $lvl => $data) {
            if ($totalXp >= $data['xp']) {
                $level = $lvl;
            }
        }
        if ($user->profile->level !== $level) {
            $user->profile->update(['level' => $level]);
        }
    }

    /**
     * Check and award all achievements for a user.
     */
    public function check(User $user): void
    {
        $friendCount = PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->count();

        // Friend milestones
        if ($friendCount >= 1) $this->award($user, 'first-friend');
        if ($friendCount >= 10) $this->award($user, 'social-butterfly');
        if ($friendCount >= 50) $this->award($user, 'popular');

        // LFG hosting
        $lfgHosted = LfgPost::where('user_id', $user->id)->count();
        if ($lfgHosted >= 5) $this->award($user, 'squad-leader');
        if ($lfgHosted >= 20) $this->award($user, 'mentor');

        // LFG closed sessions (completed)
        $completedSessions = LfgPost::where('status', 'closed')
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('responses', fn ($r) => $r->where('user_id', $user->id)->where('status', 'accepted'));
            })->count();
        if ($completedSessions >= 5) $this->award($user, 'squad-goals');

        // LFG responses accepted
        $acceptedResponses = LfgResponse::where('user_id', $user->id)->where('status', 'accepted')->count();
        if ($acceptedResponses >= 10) $this->award($user, 'team-player');

        // Accepted others into groups (recruiter)
        $acceptedOthers = LfgResponse::whereHas('lfgPost', fn ($q) => $q->where('user_id', $user->id))
            ->where('status', 'accepted')->count();
        if ($acceptedOthers >= 25) $this->award($user, 'recruiter');

        // Clips
        $clipCount = Clip::where('user_id', $user->id)->count();
        if ($clipCount >= 5) $this->award($user, 'content-creator');
        if ($clipCount >= 20) $this->award($user, 'clip-king');

        // Games
        $gameCount = $user->games()->count();
        if ($gameCount >= 5) $this->award($user, 'game-collector');

        // Messages
        $messageCount = Message::where('sender_id', $user->id)->count();
        if ($messageCount >= 50) $this->award($user, 'conversation-starter');
        if ($messageCount >= 500) $this->award($user, 'chatterbox');

        // Early adopter
        if ($user->created_at && $user->created_at->lt('2026-07-01')) {
            $this->award($user, 'early-adopter');
        }

        // Ratings given
        $ratingsGiven = LfgRating::where('rater_id', $user->id)->count();
        if ($ratingsGiven >= 1) $this->award($user, 'first-blood');

        // Ratings received
        $ratingsReceived = LfgRating::where('rated_id', $user->id);
        $ratingCount = $ratingsReceived->count();
        $avgRating = $ratingCount > 0 ? $ratingsReceived->avg('score') : 0;

        if ($ratingCount >= 10) $this->award($user, 'trusted-player');
        if ($ratingCount >= 3 && $avgRating >= 4.5) $this->award($user, 'top-rated');
        if ($ratingCount >= 20 && $avgRating >= 4.5) $this->award($user, 'all-star');

        // Clean record: 25+ ratings, zero toxic/no-show tags
        if ($ratingCount >= 25) {
            $toxicCount = LfgRating::where('rated_id', $user->id)
                ->where(function ($q) {
                    $q->where('tag', 'like', '%toxic%')->orWhere('tag', 'like', '%no_show%');
                })->count();
            if ($toxicCount === 0) $this->award($user, 'no-toxic');
        }

        // Globe trotter: played with people from 5+ regions
        try {
            $regionCount = PlayerMatch::where(function ($q) use ($user) {
                $q->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id);
            })
                ->with(['userOne.profile', 'userTwo.profile'])
                ->get()
                ->map(function ($match) use ($user) {
                    $partner = $match->user_one_id === $user->id ? $match->userTwo : $match->userOne;
                    return $partner->profile?->region;
                })
                ->filter()
                ->unique()
                ->count();
            if ($regionCount >= 5) $this->award($user, 'globe-trotter');
        } catch (\Throwable) {
            // Skip if query fails
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
        if (!$achievement) return false;

        $exists = UserAchievement::where('user_id', $user->id)
            ->where('achievement_id', $achievement->id)
            ->exists();

        if ($exists) return false;

        UserAchievement::create([
            'user_id' => $user->id,
            'achievement_id' => $achievement->id,
        ]);

        // Update points + XP on profile
        $totalPoints = UserAchievement::where('user_id', $user->id)
            ->join('achievements', 'achievements.id', '=', 'user_achievements.achievement_id')
            ->sum('achievements.points');

        if ($user->profile) {
            $user->profile->update(['achievement_points' => $totalPoints]);
            // Achievement points also contribute to XP
            $user->profile->increment('xp', $achievement->points);

            // Recalculate level
            $totalXp = $user->profile->fresh()->xp;
            $level = 1;
            foreach (self::LEVELS as $lvl => $data) {
                if ($totalXp >= $data['xp']) $level = $lvl;
            }
            $user->profile->update(['level' => $level]);
        }

        return true;
    }
}
