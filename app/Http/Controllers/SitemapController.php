<?php

namespace App\Http\Controllers;

use App\Models\ChangelogEntry;
use App\Models\CommunityPost;
use App\Models\Game;
use App\Models\Profile;
use Illuminate\Support\Facades\Cache;

class SitemapController extends Controller
{
    public function index()
    {
        // Rendering the sitemap loads every profile + every game + every
        // published community post / changelog entry and renders a Blade
        // view over it. Cache for 6 hours — crawlers are fine with
        // near-realtime accuracy, and this prevents a full-table scan on
        // every bot visit. Shorter than before because new LFG-adjacent
        // content (community posts, changelog) is time-sensitive.
        $xml = Cache::remember('sitemap:xml:v3', 21600, function () {
            $profiles = Profile::whereNotNull('username')
                ->select('username', 'avatar', 'updated_at')
                ->get();
            $games = Game::select('slug', 'name', 'cover_image', 'updated_at')->get();
            $communityPosts = CommunityPost::whereNull('hidden_at')
                ->select('id', 'title', 'updated_at')
                ->get();
            $changelog = ChangelogEntry::published()
                ->select('slug', 'title', 'published_at', 'updated_at')
                ->get();

            return view('sitemap', compact('profiles', 'games', 'communityPosts', 'changelog'))->render();
        });

        return response($xml)
            ->header('Content-Type', 'application/xml; charset=utf-8')
            // Public cache so crawlers + CDNs can hold onto the XML
            // instead of hammering the app. 1h matches our backing
            // app-cache window, max-stale lets them serve stale
            // briefly if our origin blips.
            ->header('Cache-Control', 'public, max-age=3600, stale-while-revalidate=600')
            ->header('X-Robots-Tag', 'noindex');
    }
}
