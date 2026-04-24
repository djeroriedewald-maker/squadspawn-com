<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Game;
use App\Services\AchievementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ClipController extends Controller
{
    /** Hosts we accept per selected platform. */
    private const PLATFORM_HOSTS = [
        'youtube' => ['youtube.com', 'www.youtube.com', 'youtu.be', 'm.youtube.com'],
        'twitch'  => ['twitch.tv', 'www.twitch.tv', 'clips.twitch.tv', 'm.twitch.tv'],
        'tiktok'  => ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'm.tiktok.com'],
    ];

    public function index(Request $request): Response
    {
        $query = Clip::with(['user.profile', 'game'])->latest();

        if ($request->filled('game_id')) {
            $query->where('game_id', $request->input('game_id'));
        }

        $clips = $query->paginate(12)->withQueryString();

        return Inertia::render('Clips/Index', [
            'clips' => $clips,
            'games' => Game::all(),
            'filters' => $request->only('game_id'),
            'seo' => [
                'title' => 'Gaming Clips & Highlights · SquadSpawn',
                'description' => 'Watch clutch plays, funny moments, and highlights from the SquadSpawn community. YouTube, Twitch, and TikTok clips from gamers across CS2, Valorant, Apex, League of Legends and more.',
                'keywords' => 'gaming clips, gaming highlights, esports clips, CS2 clips, Valorant highlights, Apex Legends plays, twitch clips, YouTube gaming, tiktok gaming, clutch plays, squadspawn clips',
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:100'],
            'url' => ['required', 'url', 'max:500', new \App\Rules\SafeUrl],
            'game_id' => ['nullable', 'exists:games,id'],
            'platform' => ['required', 'in:youtube,twitch,tiktok'],
        ]);

        // Platform and URL host must match — otherwise the frontend embed
        // renders the wrong player (and it's a trust-cue: a "YouTube" clip
        // should come from a YouTube URL).
        $host = strtolower(parse_url($validated['url'], PHP_URL_HOST) ?? '');
        $allowed = self::PLATFORM_HOSTS[$validated['platform']] ?? [];
        if (!in_array($host, $allowed, true)) {
            throw ValidationException::withMessages([
                'url' => "That URL doesn't match the selected platform.",
            ]);
        }

        $clip = auth()->user()->clips()->create($validated);
        $clip->load(['user.profile', 'game']);

        app(AchievementService::class)->check(auth()->user());

        return response()->json($clip, 201);
    }

    public function destroy(Clip $clip): JsonResponse
    {
        if ($clip->user_id !== auth()->id()) {
            abort(403);
        }

        $clip->delete();
        return response()->json(['ok' => true]);
    }
}
