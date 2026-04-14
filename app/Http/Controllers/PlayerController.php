<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Clip;
use App\Models\Profile;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function show(string $username): Response
    {
        $profile = Profile::where('username', $username)->firstOrFail();
        $player = $profile->user;
        $player->load(['profile', 'games']);

        // Check if the viewer is blocked by this player
        $viewer = auth()->user();
        if ($viewer) {
            $isBlocked = Block::where('blocker_id', $player->id)
                ->where('blocked_id', $viewer->id)
                ->exists();

            if ($isBlocked) {
                abort(404);
            }
        }

        $clips = Clip::where('user_id', $player->id)
            ->with('game')
            ->latest()
            ->take(6)
            ->get();

        return Inertia::render('Player/Show', [
            'player' => $player,
            'clips' => $clips,
        ]);
    }
}
