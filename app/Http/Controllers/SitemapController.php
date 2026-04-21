<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Profile;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function index()
    {
        // Rendering the sitemap loads every profile + every game and
        // renders a Blade view over it. Cache the rendered XML for a day
        // — crawlers are fine with near-realtime accuracy, and this keeps
        // us from doing a full-table scan on every bot visit.
        $xml = Cache::remember('sitemap:xml', 86400, function () {
            $profiles = Profile::select('username', 'updated_at')->get();
            $games = Game::select('slug', 'updated_at')->get();

            return view('sitemap', compact('profiles', 'games'))->render();
        });

        return response($xml)->header('Content-Type', 'text/xml');
    }
}
