<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiscoveryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();

        // IDs the current user has already liked (to exclude from results)
        $likedUserIds = $user->likedUsers()->pluck('liked_id');

        $query = User::query()
            ->where('id', '!=', $user->id)
            ->whereNotIn('id', $likedUserIds)
            ->whereHas('profile')
            ->with(['profile', 'games']);

        // Filter by game
        if ($request->filled('game_id')) {
            $query->whereHas('games', function ($q) use ($request) {
                $q->where('games.id', $request->input('game_id'));
            });
        }

        // Filter by rank (requires a game context)
        if ($request->filled('rank')) {
            $query->whereHas('games', function ($q) use ($request) {
                $q->where('user_games.rank', $request->input('rank'));
                if ($request->filled('game_id')) {
                    $q->where('games.id', $request->input('game_id'));
                }
            });
        }

        // Filter by region
        if ($request->filled('region')) {
            $query->whereHas('profile', function ($q) use ($request) {
                $q->where('region', $request->input('region'));
            });
        }

        // Filter by playtime / available_times
        if ($request->filled('playtime')) {
            $query->whereHas('profile', function ($q) use ($request) {
                $q->whereJsonContains('available_times', $request->input('playtime'));
            });
        }

        $players = $query->paginate(20)->withQueryString();

        return Inertia::render('Discovery/Index', [
            'players' => $players,
            'games' => Game::all(),
            'filters' => $request->only(['game_id', 'rank', 'region', 'playtime']),
        ]);
    }
}
