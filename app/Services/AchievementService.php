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
     * XP level thresholds — calibrated so Legend (level 6) stays
     * aspirational at ~3+ years of consistent quality activity, not 3-4
     * months of grind. Per-action XP rewards are deliberately small so
     * achievements + 5-star ratings dominate progression.
     */
    public const LEVELS = [
        1 => ['name' => 'Rookie', 'xp' => 0],
        2 => ['name' => 'Player', 'xp' => 250],
        3 => ['name' => 'Veteran', 'xp' => 1500],
        4 => ['name' => 'Elite', 'xp' => 5000],
        5 => ['name' => 'Champion', 'xp' => 15000],
        6 => ['name' => 'Legend', 'xp' => 40000],
    ];

    /**
     * XP rewards for actions. Calibrated 2026-04-28: removed message-sent
     * XP (pure grind, didn't reward quality), bumped quality-signals
     * (5-star received, new friend) so progression rewards being
     * trustworthy over being noisy.
     */
    public static function awardXp(User $user, string $action): void
    {
        $xpMap = [
            'daily_login' => 5,
            'lfg_hosted' => 25,
            'lfg_joined' => 10,
            'rating_given' => 5,
            'rating_received_5star' => 30,
            'new_friend' => 15,
            'clip_shared' => 10,
        ];

        $xp = $xpMap[$action] ?? 0;
        if ($xp === 0 || !$user->profile) return;

        $user->profile->increment('xp', $xp);
        self::recalculateLevel($user->fresh());
    }

    /**
     * Award level based on current XP, with a Legend-gate that prevents
     * pure grind from reaching the top tier. A user who passes the XP
     * threshold for Legend but fails any gate is capped at Champion.
     */
    public static function recalculateLevel(User $user): void
    {
        if (!$user->profile) return;

        $totalXp = $user->profile->xp;
        $level = 1;
        foreach (self::LEVELS as $lvl => $data) {
            if ($totalXp >= $data['xp']) $level = $lvl;
        }

        // Cap at Champion if Legend gates aren't met. Means high XP alone
        // is necessary but not sufficient — must also be a trusted, long-
        // tenured, achievement-rich account.
        if ($level === 6 && !self::passesLegendGates($user)) {
            $level = 5;
        }

        if ($user->profile->level !== $level) {
            $user->profile->update(['level' => $level]);
        }
    }

    /**
     * Returns the per-gate status for Legend. Used by the UI to show
     * exactly what's blocking a Champion from levelling up — no
     * mystery boxes.
     *
     * @return array{ratings:array,avg:array,clean:array,tenure:array,achievements:array,banned:array}
     */
    public static function legendGates(User $user): array
    {
        $ratings = LfgRating::where('rated_id', $user->id);
        $ratingCount = $ratings->count();
        $avg = $ratingCount > 0 ? (float) $ratings->avg('score') : 0.0;
        $toxic = $ratingCount > 0
            ? LfgRating::where('rated_id', $user->id)
                ->where(function ($q) {
                    $q->where('tag', 'like', '%toxic%')->orWhere('tag', 'like', '%no_show%');
                })->count()
            : 0;
        $toxicRatio = $ratingCount > 0 ? $toxic / $ratingCount : 0;
        $tenureDays = $user->created_at ? (int) $user->created_at->diffInDays(now()) : 0;
        $achievements = UserAchievement::where('user_id', $user->id)->count();
        $banned = (bool) ($user->is_banned ?? false);

        return [
            'ratings'      => ['ok' => $ratingCount >= 50,    'current' => $ratingCount,            'target' => 50,    'label' => 'ratings received'],
            'avg'          => ['ok' => $avg >= 4.7,           'current' => round($avg, 2),          'target' => 4.7,   'label' => 'average rating'],
            'clean'        => ['ok' => $toxicRatio < 0.02,    'current' => round($toxicRatio * 100, 1), 'target' => 2,  'label' => '% toxic flags (max)'],
            'tenure'       => ['ok' => $tenureDays >= 90,     'current' => $tenureDays,             'target' => 90,    'label' => 'days since signup'],
            'achievements' => ['ok' => $achievements >= 18,   'current' => $achievements,           'target' => 18,    'label' => 'achievements unlocked'],
            'banned'       => ['ok' => !$banned,              'current' => $banned ? 1 : 0,         'target' => 0,     'label' => 'no active ban'],
        ];
    }

    private static function passesLegendGates(User $user): bool
    {
        foreach (self::legendGates($user) as $gate) {
            if (!$gate['ok']) return false;
        }
        return true;
    }

    /**
     * Run every check + award eligible achievements. Idempotent — safe
     * to call after any state change (rating, LFG close, friend match).
     */
    public function check(User $user): void
    {
        $friendCount = PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->count();

        if ($friendCount >= 1) $this->award($user, 'first-friend');
        if ($friendCount >= 10) $this->award($user, 'social-butterfly');
        if ($friendCount >= 50) $this->award($user, 'popular');

        $lfgHosted = LfgPost::where('user_id', $user->id)->count();
        if ($lfgHosted >= 5) $this->award($user, 'squad-leader');
        if ($lfgHosted >= 20) $this->award($user, 'mentor');

        $completedSessions = LfgPost::where('status', 'closed')
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                    ->orWhereHas('responses', fn ($r) => $r->where('user_id', $user->id)->where('status', 'accepted'));
            })->count();
        if ($completedSessions >= 5) $this->award($user, 'squad-goals');

        $acceptedResponses = LfgResponse::where('user_id', $user->id)->where('status', 'accepted')->count();
        if ($acceptedResponses >= 10) $this->award($user, 'team-player');

        $acceptedOthers = LfgResponse::whereHas('lfgPost', fn ($q) => $q->where('user_id', $user->id))
            ->where('status', 'accepted')->count();
        if ($acceptedOthers >= 25) $this->award($user, 'recruiter');

        $clipCount = Clip::where('user_id', $user->id)->count();
        if ($clipCount >= 5) $this->award($user, 'content-creator');
        if ($clipCount >= 20) $this->award($user, 'clip-king');

        $gameCount = $user->games()->count();
        if ($gameCount >= 5) $this->award($user, 'game-collector');

        $messageCount = Message::where('sender_id', $user->id)->count();
        if ($messageCount >= 50) $this->award($user, 'conversation-starter');
        if ($messageCount >= 500) $this->award($user, 'chatterbox');

        if ($user->created_at && $user->created_at->lt('2026-07-01')) {
            $this->award($user, 'early-adopter');
        }

        $ratingsGiven = LfgRating::where('rater_id', $user->id)->count();
        if ($ratingsGiven >= 1) $this->award($user, 'first-blood');

        $ratingsReceived = LfgRating::where('rated_id', $user->id);
        $ratingCount = $ratingsReceived->count();
        $avgRating = $ratingCount > 0 ? (float) $ratingsReceived->avg('score') : 0;

        if ($ratingCount >= 10) $this->award($user, 'trusted-player');
        if ($ratingCount >= 3 && $avgRating >= 4.5) $this->award($user, 'top-rated');
        if ($ratingCount >= 20 && $avgRating >= 4.5) $this->award($user, 'all-star');

        if ($ratingCount >= 25) {
            $toxicCount = LfgRating::where('rated_id', $user->id)
                ->where(function ($q) {
                    $q->where('tag', 'like', '%toxic%')->orWhere('tag', 'like', '%no_show%');
                })->count();
            if ($toxicCount === 0) $this->award($user, 'no-toxic');
        }

        // Hall of Famer — the toughest reputation achievement. Mirrors
        // the 'avg' + 'clean' Legend gates but at a higher rating count
        // so it's earnable before Legend itself, and its 500 XP makes
        // a real dent toward the Legend threshold.
        if ($ratingCount >= 100 && $avgRating >= 4.7) {
            $toxicCount = LfgRating::where('rated_id', $user->id)
                ->where(function ($q) {
                    $q->where('tag', 'like', '%toxic%')->orWhere('tag', 'like', '%no_show%');
                })->count();
            if ($toxicCount === 0) $this->award($user, 'hall-of-famer');
        }

        // Pillar of the Community — 50 hosted LFGs with strong host-trust
        // (≥80% accept-rate on responses). Closed-out hosts who reject most
        // applicants don't qualify even at high LFG counts.
        if ($lfgHosted >= 50) {
            $pillarResponses = LfgResponse::whereHas('lfgPost', fn ($q) => $q->where('user_id', $user->id))
                ->whereIn('status', ['accepted', 'rejected'])
                ->selectRaw('status, COUNT(*) as c')
                ->groupBy('status')
                ->pluck('c', 'status');
            $accepted = (int) ($pillarResponses['accepted'] ?? 0);
            $rejected = (int) ($pillarResponses['rejected'] ?? 0);
            $total = $accepted + $rejected;
            if ($total > 0 && ($accepted / $total) >= 0.8) {
                $this->award($user, 'pillar-of-the-community');
            }
        }

        // Living Legend — only awarded once the user has actually crossed
        // into level 6 (which itself requires the gates above to pass).
        // Self-reinforcing: hitting Legend grants Living Legend → +500 XP →
        // pads the Legend buffer so a single rating dip doesn't demote you.
        if (($user->profile?->level ?? 0) >= 6) {
            $this->award($user, 'living-legend');
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

        $totalPoints = UserAchievement::where('user_id', $user->id)
            ->join('achievements', 'achievements.id', '=', 'user_achievements.achievement_id')
            ->sum('achievements.points');

        if ($user->profile) {
            $user->profile->update(['achievement_points' => $totalPoints]);
            // Achievement points contribute to XP — quality > grind.
            $user->profile->increment('xp', $achievement->points);
            self::recalculateLevel($user->fresh());
        }

        return true;
    }
}
