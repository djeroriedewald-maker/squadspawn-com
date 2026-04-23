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
        ]);

        $dob = Carbon::parse($request->date_of_birth);
        $age = $dob->age;

        // Launch-window policy: 16+ only (AVG Art. 8 — no self-checked
        // parental consent loophole). Under-16 accounts are logged out
        // immediately with a clear message.
        if ($age < 16) {
            auth()->logout();
            $request->session()->invalidate();

            return redirect('/')->with('message', 'You must be at least 16 years old to use SquadSpawn. Your account has been logged out.');
        }

        $user = auth()->user();
        $user->update([
            'date_of_birth' => $request->date_of_birth,
        ]);

        return redirect()->route('dashboard');
    }
}
