<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
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
            // 2) Email match but no Google link yet. We refuse to auto-link
            //    — that's an account-takeover vector (attacker creates a
            //    Gmail with a victim's email and claims the account). The
            //    user has to prove email ownership by signing in with their
            //    password first, then link Google from their settings.
            $existing = User::where('email', $googleUser->getEmail())->first();
            if ($existing) {
                return redirect()->route('login')->withErrors([
                    'email' => 'This email is already registered with a password. Sign in first, then link Google from your settings.',
                ]);
            }

            // 3) Fresh sign-up.
            $user = User::create([
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'password' => bcrypt(str()->random(32)),
                'email_verified_at' => now(),
            ]);
        }

        Auth::login($user, remember: true);

        return redirect()->route('dashboard');
    }
}
