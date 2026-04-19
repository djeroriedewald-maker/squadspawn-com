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

        $platforms = Game::pluck('platforms')
            ->map(fn ($p) => is_array($p) ? $p : [])
            ->flatten()
            ->filter()
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
                'title' => 'All Games · SquadSpawn',
                'description' => "Browse games and find teammates for your favourites on SquadSpawn. Filter by genre, platform, and more.",
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
                'title' => "{$game->name} · Find Teammates on SquadSpawn",
                'description' => \Illuminate\Support\Str::limit(
                    $game->description ?? "Find teammates for {$game->name} on SquadSpawn. Create LFG, swipe through players, and rate teammates after every session.",
                    160,
                ),
                'image' => $game->cover_image ? url($game->cover_image) : null,
            ],
            'jsonLd' => [
                '@context' => 'https://schema.org',
                '@type' => 'VideoGame',
                'name' => $game->name,
                'description' => $game->description,
                'image' => $game->cover_image ? url($game->cover_image) : null,
                'genre' => $game->genre,
                'gamePlatform' => $game->platforms,
                'datePublished' => optional($game->released_at)->toDateString(),
            ],
        ]);
    }

    public function quickAdd(Game $game): RedirectResponse
    {
        $user = auth()->user();
        if (!$user->games()->where('games.id', $game->id)->exists()) {
            $user->games()->attach($game->id);
        }
        return back();
    }

    public function quickRemove(Game $game): RedirectResponse
    {
        auth()->user()->games()->detach($game->id);
        return back();
    }
}
