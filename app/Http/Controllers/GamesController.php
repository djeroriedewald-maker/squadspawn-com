<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GamesController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $genre = $request->input('genre');
        $platform = $request->input('platform');
        $sort = $request->input('sort', 'popular');
        $mine = (bool) $request->boolean('mine');

        $query = Game::query()->withCount('users');

        if ($search !== '') {
            $query->where('name', 'like', '%' . $search . '%');
        }
        if ($genre) {
            $query->where('genre', $genre);
        }
        if ($platform) {
            $query->whereJsonContains('platforms', $platform);
        }
        if ($mine && auth()->check()) {
            $query->whereHas('users', fn ($q) => $q->where('users.id', auth()->id()));
        }

        match ($sort) {
            'alphabetical' => $query->orderBy('name'),
            'newest' => $query->orderByDesc('created_at'),
            'released' => $query->orderByDesc('released_at'),
            default => $query->orderByDesc('users_count')->orderBy('name'),
        };

        $games = $query->paginate(20)->withQueryString();

        $genres = Game::query()
            ->whereNotNull('genre')
            ->where('genre', '!=', '')
            ->distinct()
            ->orderBy('genre')
            ->pluck('genre');

        // Flatten + defend: some imported rows may have stored platforms as
        // objects instead of strings (legacy bug). Keep only strings.
        $platforms = Game::pluck('platforms')
            ->map(fn ($p) => is_array($p) ? $p : [])
            ->flatten()
            ->filter(fn ($p) => is_string($p) && $p !== '')
            ->unique()
            ->sort()
            ->values();

        $myGameIds = auth()->check()
            ? auth()->user()->games()->pluck('games.id')->toArray()
            : [];

        return Inertia::render('Games/Index', [
            'games' => $games,
            'filters' => [
                'search' => $search,
                'genre' => $genre,
                'platform' => $platform,
                'sort' => $sort,
                'mine' => $mine,
            ],
            'filterOptions' => [
                'genres' => $genres,
                'platforms' => $platforms,
            ],
            'myGameIds' => $myGameIds,
            'seo' => [
                'title' => 'All Games · Find Teammates · SquadSpawn',
                'description' => "Browse every game on SquadSpawn and find verified teammates. Filter by genre, platform, and region across CS2, Valorant, Apex, League of Legends, Fortnite, Warzone, Overwatch, Rocket League and more.",
                'keywords' => 'game library, find teammates, LFG games, CS2 teammates, Valorant teammates, Apex Legends teammates, League of Legends duo, Fortnite squad',
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $game = Game::withCount('users')->where('slug', $slug)->firstOrFail();

        $relatedGames = Game::query()
            ->where('id', '!=', $game->id)
            ->when($game->genre, fn ($q) => $q->where('genre', $game->genre))
            ->withCount('users')
            ->orderByDesc('users_count')
            ->take(6)
            ->get();

        $isInMyProfile = auth()->check()
            && auth()->user()->games()->where('games.id', $game->id)->exists();

        return Inertia::render('Games/Show', [
            'game' => $game,
            'relatedGames' => $relatedGames,
            'isInMyProfile' => $isInMyProfile,
            'seo' => [
                'title' => "{$game->name} LFG · Find Teammates · SquadSpawn",
                'description' => \Illuminate\Support\Str::limit(
                    "Find verified {$game->name} teammates on SquadSpawn. "
                    . ($game->users_count > 0
                        ? "{$game->users_count} players already on board — "
                        : '')
                    . "create an LFG, rate players, and build your reputation across NA, EU and Asia. Free forever.",
                    160,
                ),
                'image' => $game->cover_image ? url($game->cover_image) : null,
                'keywords' => "{$game->name} LFG, {$game->name} teammates, {$game->name} squad finder, {$game->name} looking for group, find {$game->name} players, {$game->name} verified gamers",
            ],
            'jsonLd' => [
                '@context' => 'https://schema.org',
                '@graph' => [
                    array_filter([
                        '@type' => 'VideoGame',
                        'name' => $game->name,
                        'description' => $game->description,
                        'image' => $game->cover_image ? url($game->cover_image) : null,
                        'genre' => $game->genre,
                        'gamePlatform' => $game->platforms,
                        'datePublished' => optional($game->released_at)->toDateString(),
                        'url' => url("/games/{$game->slug}"),
                    ]),
                    [
                        '@type' => 'BreadcrumbList',
                        'itemListElement' => [
                            ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => url('/')],
                            ['@type' => 'ListItem', 'position' => 2, 'name' => 'Games', 'item' => url('/games')],
                            ['@type' => 'ListItem', 'position' => 3, 'name' => $game->name, 'item' => url("/games/{$game->slug}")],
                        ],
                    ],
                ],
            ],
        ]);
    }

    public function quickAdd(Game $game): RedirectResponse
    {
        $user = auth()->user();
        if (!$user->games()->where('games.id', $game->id)->exists()) {
            // user_games.platform is NOT NULL — default to the game's first
            // listed platform (or 'any' as a safe sentinel). Users can refine
            // via profile setup.
            $defaultPlatform = (is_array($game->platforms) && !empty($game->platforms))
                ? (string) $game->platforms[0]
                : 'any';
            $user->games()->attach($game->id, ['platform' => $defaultPlatform]);
        }
        \Illuminate\Support\Facades\Cache::forget("user:{$user->id}:games");
        return back();
    }

    public function quickRemove(Game $game): RedirectResponse
    {
        $user = auth()->user();
        $user->games()->detach($game->id);
        \Illuminate\Support\Facades\Cache::forget("user:{$user->id}:games");
        return back();
    }
}
