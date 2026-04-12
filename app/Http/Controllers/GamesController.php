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
        ]);
    }
}
