<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Game;
use App\Services\AchievementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClipController extends Controller
{
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
