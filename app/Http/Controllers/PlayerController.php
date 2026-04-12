<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Profile;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function show(string $username): Response
    {
        $profile = Profile::where('username', $username)->firstOrFail();
        $user = $profile->user;
        $user->load(['profile', 'games']);

        $clips = Clip::where('user_id', $user->id)
            ->with('game')
            ->latest()
            ->take(6)
            ->get();

        return Inertia::render('Player/Show', [
            'player' => $user,
            'clips' => $clips,
        ]);
    }
}
