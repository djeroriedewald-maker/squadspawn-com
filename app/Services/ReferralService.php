<?php

namespace App\Services;

use App\Models\PlayerMatch;
use App\Models\User;
use App\Notifications\NewMatchNotification;

class ReferralService
{
    /**
     * STAGE 1 (runs at signup): record the inviter attribution only.
     *
     * We used to create the PlayerMatch + notify on the signup call,
     * which made the counter and the "you have a new friend" push
     * farmable — one user could mint throwaway accounts with their
     * own ref code to inflate invitedCount and friend counts before
     * anyone finished onboarding. Now we just stamp who invited them
     * and defer the actual friendship to the profile-complete step.
     */
    public static function attributeSignup(User $newUser, ?string $refCode): ?User
    {
        if (!$refCode) {
            return null;
        }

        $referrer = User::where('referral_code', strtoupper($refCode))->first();
        if (!$referrer || $referrer->id === $newUser->id) {
            return null;
        }

        $newUser->forceFill(['referred_by_user_id' => $referrer->id])->save();

        return $referrer;
    }

    /**
     * STAGE 2 (runs when the invitee completes their profile): now
     * that we know they're a real user who stuck around past the
     * one-click signup, materialise the friendship + notify both
     * sides. Idempotent — safe to call on every profile save.
     */
    public static function completeReferralIfPending(User $user): ?User
    {
        if (!$user->referred_by_user_id) {
            return null;
        }

        $referrer = User::find($user->referred_by_user_id);
        if (!$referrer || $referrer->id === $user->id) {
            return null;
        }

        $match = PlayerMatch::firstOrCreate([
            'user_one_id' => min($user->id, $referrer->id),
            'user_two_id' => max($user->id, $referrer->id),
        ]);

        // firstOrCreate returns the existing match on subsequent calls;
        // `wasRecentlyCreated` tells us whether this call is the first
        // materialisation, so we only fire the notification once.
        if ($match->wasRecentlyCreated) {
            try {
                $match->load(['userOne.profile', 'userTwo.profile']);
                $referrer->notify(new NewMatchNotification($user, $match->id, $match->uuid));
                $user->notify(new NewMatchNotification($referrer, $match->id, $match->uuid));
            } catch (\Throwable) {
                // Best-effort: don't fail the profile save if notify breaks.
            }
        }

        return $referrer;
    }
}
