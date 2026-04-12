<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\LfgPost;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LfgController extends Controller
{
    public function index(Request $request): Response
    {
        $query = LfgPost::open()
            ->with(['user.profile', 'game', 'responses.user.profile'])
            ->latest();

        if ($request->filled('game_id')) {
            $query->where('game_id', $request->input('game_id'));
        }

        if ($request->filled('platform')) {
            $query->where('platform', $request->input('platform'));
        }

        $posts = $query->paginate(20)->withQueryString();

        return Inertia::render('Lfg/Index', [
            'posts' => $posts,
            'games' => Game::all(),
            'filters' => $request->only(['game_id', 'platform']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Lfg/Create', [
            'games' => Game::all(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'game_id' => 'required|exists:games,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'spots_needed' => 'required|integer|min:1|max:9',
            'platform' => 'required|string|max:50',
            'rank_min' => 'nullable|string|max:50',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $validated['user_id'] = auth()->id();

        LfgPost::create($validated);

        return redirect()->route('lfg.index');
    }

    public function respond(Request $request, LfgPost $lfgPost)
    {
        $request->validate([
            'message' => 'nullable|string|max:500',
        ]);

        if ($lfgPost->status !== 'open') {
            return response()->json(['error' => 'This post is no longer open.'], 422);
        }

        if ($lfgPost->user_id === auth()->id()) {
            return response()->json(['error' => 'You cannot respond to your own post.'], 422);
        }

        $existing = $lfgPost->responses()->where('user_id', auth()->id())->first();
        if ($existing) {
            return response()->json(['error' => 'You have already responded to this post.'], 422);
        }

        $lfgPost->responses()->create([
            'user_id' => auth()->id(),
            'message' => $request->input('message'),
        ]);

        $lfgPost->increment('spots_filled');

        if ($lfgPost->fresh()->spots_filled >= $lfgPost->spots_needed) {
            $lfgPost->update(['status' => 'full']);
        }

        return response()->json([
            'success' => true,
            'spots_filled' => $lfgPost->fresh()->spots_filled,
            'status' => $lfgPost->fresh()->status,
        ]);
    }
}
