<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Profile;

class SitemapController extends Controller
{
    public function index()
    {
        $profiles = Profile::select('username', 'updated_at')->get();
        $games = Game::select('slug', 'updated_at')->get();

        return response()
            ->view('sitemap', compact('profiles', 'games'))
            ->header('Content-Type', 'text/xml');
    }
}
