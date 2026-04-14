<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Clip;
use App\Models\LfgRating;
use App\Models\PlayerMatch;
use App\Models\Profile;
use App\Services\ReputationService;
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

        // Calculate reputation with breakdown
        $reputationData = app(ReputationService::class)->calculate($player);

        // Friends count
        $friendsCount = PlayerMatch::where('user_one_id', $player->id)
            ->orWhere('user_two_id', $player->id)
            ->count();

        return Inertia::render('Player/Show', [
            'player' => $player,
            'clips' => $clips,
            'reputationData' => $reputationData,
            'friendsCount' => $friendsCount,
        ]);
    }
}
