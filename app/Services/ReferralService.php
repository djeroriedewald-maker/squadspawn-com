<?php

namespace App\Services;

use App\Models\PlayerMatch;
use App\Models\User;
use App\Notifications\NewMatchNotification;

class ReferralService
{
    /**
     * Attribute a fresh signup to a referrer (looked up by code) and
     * auto-befriend the two users so they appear in each other's friend list
     * immediately. Returns the referrer if attribution succeeded.
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

        $match = PlayerMatch::firstOrCreate([
            'user_one_id' => min($newUser->id, $referrer->id),
            'user_two_id' => max($newUser->id, $referrer->id),
        ]);

        try {
            $match->load(['userOne.profile', 'userTwo.profile']);
            $referrer->notify(new NewMatchNotification($newUser, $match->id, $match->uuid));
            $newUser->notify(new NewMatchNotification($referrer, $match->id, $match->uuid));
        } catch (\Throwable) {
            // Best-effort: don't fail the signup if push/db notify misbehaves.
        }

        return $referrer;
    }
}
