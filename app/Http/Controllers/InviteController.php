<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class InviteController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        // Make sure old accounts that predate the referral feature get a
        // code generated lazily. Keeps existing users from seeing a blank
        // invite link.
        if (blank($user->referral_code)) {
            $user->referral_code = User::generateUniqueReferralCode();
            $user->save();
        }

        // Only count invitees who actually became real players (have a
        // profile). Otherwise one person could mint throwaway accounts
        // with their own ref code to pump the counter.
        $invitedCount = User::where('referred_by_user_id', $user->id)
            ->whereHas('profile')
            ->count();
        $inviteUrl = url('/?ref=' . $user->referral_code);

        return Inertia::render('Invite/Index', [
            'referralCode' => $user->referral_code,
            'inviteUrl' => $inviteUrl,
            'invitedCount' => $invitedCount,
            'seo' => [
                'title' => 'Invite friends · SquadSpawn',
                'description' => 'Invite your squad to SquadSpawn and grow the community together.',
            ],
        ]);
    }
}
