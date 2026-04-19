<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Inertia\Inertia;
use Inertia\Response;

class GamesController extends Controller
{
    public function index(): Response
    {
        $games = Game::withCount('users')->get();

        return Inertia::render('Games/Index', [
            'games' => $games,
            'seo' => [
                'title' => 'All Games · SquadSpawn',
                'description' => "Browse all {$games->count()} games on SquadSpawn and find teammates for your favourites. From Valorant and Fortnite to Mobile Legends and Counter-Strike.",
            ],
        ]);
    }
}
