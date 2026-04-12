<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Inertia\Inertia;
use Inertia\Response;

class GamesController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Games/Index', [
            'games' => Game::all(),
        ]);
    }
}
