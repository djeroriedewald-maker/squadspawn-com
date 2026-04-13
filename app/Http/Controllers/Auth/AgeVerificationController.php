<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AgeVerificationController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/AgeVerification');
    }

    public function store(Request $request)
    {
        $request->validate([
            'date_of_birth' => 'required|date|before:today',
            'parental_consent' => 'nullable|boolean',
        ]);

        $dob = Carbon::parse($request->date_of_birth);
        $age = $dob->age;

        if ($age < 13) {
            auth()->logout();
            $request->session()->invalidate();

            return redirect('/')->with('message', 'You must be at least 13 years old to use SquadSpawn. Your account has been logged out.');
        }

        if ($age < 16 && !$request->parental_consent) {
            throw ValidationException::withMessages([
                'parental_consent' => 'Parental consent is required for users under 16 in the EU.',
            ]);
        }

        $user = auth()->user();
        $user->update([
            'date_of_birth' => $request->date_of_birth,
            'parental_consent' => $age < 16 ? true : false,
            'parental_consent_at' => $age < 16 ? now() : null,
        ]);

        return redirect()->route('dashboard');
    }
}
