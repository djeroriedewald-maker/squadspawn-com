<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'date_of_birth' => 'required|date|before:today',
            'parental_consent' => 'nullable|boolean',
        ]);

        // Calculate age
        $dob = Carbon::parse($request->date_of_birth);
        $age = $dob->age;

        // Must be at least 13
        if ($age < 13) {
            throw ValidationException::withMessages([
                'date_of_birth' => 'You must be at least 13 years old to use SquadSpawn.',
            ]);
        }

        // Ages 13-15 require parental consent (GDPR Article 8)
        if ($age < 16 && !$request->parental_consent) {
            throw ValidationException::withMessages([
                'parental_consent' => 'Parental consent is required for users under 16.',
            ]);
        }

        // Resolve a referral code from session if one was captured from a
        // ?ref=CODE landing visit. Fall back to request input so the form can
        // also forward it explicitly.
        $referredByUserId = null;
        $refCode = (string) ($request->session()->pull('referral_code', '') ?: $request->input('ref', ''));
        if ($refCode !== '') {
            $referrer = User::where('referral_code', strtoupper($refCode))->first();
            if ($referrer) {
                $referredByUserId = $referrer->id;
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'date_of_birth' => $request->date_of_birth,
            'parental_consent' => $age < 16 ? true : false,
            'parental_consent_at' => $age < 16 ? now() : null,
            'referred_by_user_id' => $referredByUserId,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
