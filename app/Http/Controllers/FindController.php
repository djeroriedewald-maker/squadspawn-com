<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\LfgPost;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FindController extends Controller
{
    /**
     * Per-game SEO landing page. Targets long-tail "{game} teammates",
     * "{game} squad", "find {game} players" queries — every game in the
     * catalogue gets its own URL with a curated roster + recent LFGs +
     * stats so the page has real, indexable content (not a thin SEO
     * shell). Cached 10 min so a crawl burst doesn't hammer the DB.
     */
    public function show(string $slug): Response
    {
        $game = Game::withCount('users')->where('slug', $slug)->firstOrFail();

        $payload = Cache::remember("find:{$game->id}", 600, function () use ($game) {
            $topPlayers = User::query()
                ->whereHas('profile', fn ($q) => $q->whereNotNull('username'))
                ->whereHas('games', fn ($q) => $q->where('games.id', $game->id))
                ->with(['profile' => fn ($q) => $q->select('user_id', 'username', 'avatar', 'reputation_score', 'region', 'looking_for', 'has_mic', 'is_live')])
                ->select('id', 'name', 'created_at')
                ->get()
                ->sortByDesc(fn ($u) => $u->profile?->reputation_score ?? 0)
                ->take(12)
                ->values()
                ->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->profile?->username,
                    'avatar' => $u->profile?->avatar,
                    'reputation_score' => $u->profile?->reputation_score,
                    'region' => $u->profile?->region,
                    'looking_for' => $u->profile?->looking_for,
                    'has_mic' => (bool) $u->profile?->has_mic,
                    'is_live' => (bool) $u->profile?->is_live,
                ])
                ->toArray();

            $recentLfg = LfgPost::open()
                ->where('game_id', $game->id)
                ->with(['user.profile:user_id,username,avatar', 'game:id,name,slug,cover_image'])
                ->latest()
                ->take(6)
                ->get()
                ->map(fn ($p) => [
                    'slug' => $p->slug,
                    'title' => $p->title,
                    'spots_needed' => $p->spots_needed,
                    'spots_filled' => $p->spots_filled,
                    'platform' => $p->platform,
                    'created_at_human' => $p->created_at?->diffForHumans(),
                    'user' => $p->user ? [
                        'username' => $p->user->profile?->username ?? $p->user->name,
                        'avatar' => $p->user->profile?->avatar,
                    ] : null,
                ])
                ->toArray();

            return ['topPlayers' => $topPlayers, 'recentLfg' => $recentLfg];
        });

        $playerCount = $game->users_count;
        $description = Str::limit(
            "Find verified {$game->name} teammates on SquadSpawn. "
            . ($playerCount > 0 ? "{$playerCount} players already squadding up — " : '')
            . "build your reputation, post LFGs, and play with people who actually show up. NA, EU, Asia. Free forever.",
            160,
        );

        return Inertia::render('Find/Game', [
            'game' => [
                'id' => $game->id,
                'name' => $game->name,
                'slug' => $game->slug,
                'cover_image' => $game->cover_image,
                'genre' => $game->genre,
                'platforms' => $game->platforms,
                'rank_system' => $game->rank_system,
                'description' => $game->description,
                'players_count' => $playerCount,
            ],
            'topPlayers' => $payload['topPlayers'],
            'recentLfg' => $payload['recentLfg'],
            'seo' => [
                'title' => "Find {$game->name} Teammates & Squad · SquadSpawn",
                'description' => $description,
                'image' => $game->cover_image ? url($game->cover_image) : null,
                'keywords' => "find {$game->name} teammates, {$game->name} squad finder, {$game->name} LFG, {$game->name} looking for group, {$game->name} duo partner, {$game->name} players near me, verified {$game->name} gamers",
            ],
            'jsonLd' => [
                '@context' => 'https://schema.org',
                '@graph' => [
                    [
                        '@type' => 'WebPage',
                        'name' => "Find {$game->name} Teammates",
                        'description' => $description,
                        'url' => url("/find/{$game->slug}"),
                        'about' => array_filter([
                            '@type' => 'VideoGame',
                            'name' => $game->name,
                            'genre' => $game->genre,
                            'image' => $game->cover_image ? url($game->cover_image) : null,
                        ]),
                    ],
                    [
                        '@type' => 'BreadcrumbList',
                        'itemListElement' => [
                            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => url('/')],
                            ['@type' => 'ListItem', 'position' => 2, 'name' => 'Games', 'item' => url('/games')],
                            ['@type' => 'ListItem', 'position' => 3, 'name' => "Find {$game->name} Teammates", 'item' => url("/find/{$game->slug}")],
                        ],
                    ],
                ],
            ],
        ]);
    }
}
