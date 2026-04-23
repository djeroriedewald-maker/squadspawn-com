<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReferralService;
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
        ]);

        // Launch-window policy: 16+ only. We raised the floor from 13+
        // to avoid the "self-checked parental consent" loophole (which
        // isn't verifiable consent under AVG Art. 8 Dutch AP guidance).
        // If we ever reintroduce under-16 signups it'll be behind a
        // real parent-email verification flow.
        $dob = Carbon::parse($request->date_of_birth);
        $age = $dob->age;

        if ($age < 16) {
            throw ValidationException::withMessages([
                'date_of_birth' => 'You must be at least 16 years old to sign up for SquadSpawn.',
            ]);
        }

        // Referral code may come from the session (captured on the ?ref=CODE
        // landing visit) or be forwarded explicitly by the form.
        $refCode = (string) ($request->session()->pull('referral_code', '') ?: $request->input('ref', ''));

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'date_of_birth' => $request->date_of_birth,
        ]);

        ReferralService::attributeSignup($user, $refCode ?: null);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
