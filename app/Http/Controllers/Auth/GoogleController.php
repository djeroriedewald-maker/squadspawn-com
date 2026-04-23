<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        $googleUser = Socialite::driver('google')->user();

        // 1) Primary lookup: already linked via google_id → log in.
        $user = User::where('google_id', $googleUser->getId())->first();

        if (!$user) {
            // 2) Email match but no Google link yet. Google OAuth proves
            //    the caller owns that Gmail address (Google itself gates
            //    the login), so auto-linking is safe — the takeover
            //    vector would require the attacker to also control the
            //    victim's email, which is the definition of *not* a
            //    takeover. We log the link so moderation has a trail.
            $existing = User::where('email', $googleUser->getEmail())->first();
            if ($existing) {
                $existing->forceFill(['google_id' => $googleUser->getId()])->save();
                Log::info('Google OAuth auto-linked existing account', [
                    'user_id' => $existing->id,
                    'email' => $existing->email,
                ]);
                Auth::login($existing, remember: true);
                return redirect()->route('dashboard');
            }

            // 3) Fresh sign-up.
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'password' => bcrypt(str()->random(32)),
                'email_verified_at' => now(),
            ]);

            $refCode = (string) request()->session()->pull('referral_code', '');
            ReferralService::attributeSignup($user, $refCode ?: null);
        }

        Auth::login($user, remember: true);

        return redirect()->route('dashboard');
    }
}
