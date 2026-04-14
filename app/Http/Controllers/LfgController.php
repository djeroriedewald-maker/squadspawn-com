<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\LfgMessage;
use App\Models\LfgPost;
use App\Models\LfgRating;
use App\Services\AchievementService;
use Illuminate\Http\JsonResponse;
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

        // My active LFG posts
        $myPosts = LfgPost::where('user_id', auth()->id())
            ->whereIn('status', ['open', 'full'])
            ->with(['game', 'responses.user.profile'])
            ->latest()
            ->get();

        return Inertia::render('Lfg/Index', [
            'posts' => $posts,
            'myPosts' => $myPosts,
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
            'mic_required' => 'nullable|boolean',
            'language' => 'nullable|string|max:50',
            'age_requirement' => 'nullable|string|max:20',
            'requirements_note' => 'nullable|string|max:500',
            'discord_url' => 'nullable|string|max:255',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $validated['user_id'] = auth()->id();
        LfgPost::create($validated);

        app(AchievementService::class)->check(auth()->user());

        return redirect()->route('lfg.index')->with('message', 'LFG post created!');
    }

    public function show(LfgPost $lfgPost): Response
    {
        $lfgPost->load(['user.profile', 'game', 'responses.user.profile', 'messages.user.profile', 'ratings']);

        // Sync spots_filled with actual accepted count + host
        $actualFilled = $lfgPost->responses()->where('status', 'accepted')->count() + 1;
        if ($lfgPost->spots_filled !== $actualFilled) {
            $lfgPost->update(['spots_filled' => $actualFilled]);
        }

        $user = auth()->user();
        $isMember = $lfgPost->user_id === $user->id
            || $lfgPost->responses()->where('user_id', $user->id)->where('status', 'accepted')->exists();

        // Has user already rated members of this LFG?
        $myRatings = LfgRating::where('lfg_post_id', $lfgPost->id)
            ->where('rater_id', $user->id)
            ->pluck('rated_id')
            ->toArray();

        return Inertia::render('Lfg/Show', [
            'post' => $lfgPost,
            'isMember' => $isMember,
            'myRatings' => $myRatings,
            'messages' => $isMember ? $lfgPost->messages()->with('user.profile')->latest()->take(50)->get()->reverse()->values() : [],
        ]);
    }

    public function respond(Request $request, LfgPost $lfgPost): JsonResponse
    {
        $request->validate(['message' => 'nullable|string|max:500']);

        if ($lfgPost->status !== 'open') {
            return response()->json(['error' => 'This post is no longer open.'], 422);
        }
        if ($lfgPost->user_id === auth()->id()) {
            return response()->json(['error' => 'You cannot respond to your own post.'], 422);
        }

        $existing = $lfgPost->responses()->where('user_id', auth()->id())->first();
        if ($existing) {
            return response()->json(['error' => 'You have already responded.'], 422);
        }

        $lfgPost->responses()->create([
            'user_id' => auth()->id(),
            'message' => $request->input('message'),
            'status' => 'pending',
        ]);

        return response()->json(['success' => true]);
    }

    public function acceptResponse(LfgPost $lfgPost, int $responseId): JsonResponse
    {
        if ($lfgPost->user_id !== auth()->id()) {
            return response()->json(['error' => 'Only the creator can manage responses.'], 403);
        }

        $response = $lfgPost->responses()->findOrFail($responseId);
        $response->update(['status' => 'accepted']);

        // Recalculate spots_filled from actual accepted responses (+ 1 for host)
        $acceptedCount = $lfgPost->responses()->where('status', 'accepted')->count();
        $lfgPost->update(['spots_filled' => $acceptedCount + 1]); // +1 for the host

        if ($lfgPost->spots_filled >= $lfgPost->spots_needed) {
            $lfgPost->update(['status' => 'full']);
        }

        return response()->json(['success' => true, 'status' => $lfgPost->fresh()->status]);
    }

    public function rejectResponse(LfgPost $lfgPost, int $responseId): JsonResponse
    {
        if ($lfgPost->user_id !== auth()->id()) {
            return response()->json(['error' => 'Only the creator can manage responses.'], 403);
        }

        $response = $lfgPost->responses()->findOrFail($responseId);
        $response->update(['status' => 'rejected']);

        return response()->json(['success' => true]);
    }

    public function sendMessage(Request $request, LfgPost $lfgPost): JsonResponse
    {
        $user = auth()->user();
        $isMember = $lfgPost->user_id === $user->id
            || $lfgPost->responses()->where('user_id', $user->id)->where('status', 'accepted')->exists();

        if (!$isMember) {
            return response()->json(['error' => 'Only group members can chat.'], 403);
        }

        $validated = $request->validate(['body' => 'required|string|max:1000']);

        $message = $lfgPost->messages()->create([
            'user_id' => $user->id,
            'body' => $validated['body'],
        ]);
        $message->load('user.profile');

        return response()->json($message, 201);
    }

    public function pollMessages(Request $request, LfgPost $lfgPost): JsonResponse
    {
        $user = auth()->user();

        $isMember = $lfgPost->user_id === $user->id
            || $lfgPost->responses()->where('user_id', $user->id)->where('status', 'accepted')->exists();

        if (!$isMember) {
            return response()->json(['error' => 'Only group members can view chat.'], 403);
        }

        $since = $request->input('since');

        $messages = $lfgPost->messages()
            ->with('user.profile')
            ->when($since, fn ($q) => $q->where('created_at', '>', $since))
            ->latest()
            ->take(50)
            ->get()
            ->reverse()
            ->values();

        return response()->json([
            'messages' => $messages,
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function rate(Request $request, LfgPost $lfgPost): JsonResponse
    {
        $validated = $request->validate([
            'rated_id' => 'required|exists:users,id',
            'score' => 'required|integer|min:1|max:5',
            'tag' => 'nullable|in:great_teammate,good_comms,skilled,friendly,toxic,no_show',
            'comment' => 'nullable|string|max:500',
        ]);

        LfgRating::updateOrCreate(
            [
                'lfg_post_id' => $lfgPost->id,
                'rater_id' => auth()->id(),
                'rated_id' => $validated['rated_id'],
            ],
            [
                'score' => $validated['score'],
                'tag' => $validated['tag'] ?? null,
                'comment' => $validated['comment'] ?? null,
            ]
        );

        return response()->json(['success' => true]);
    }

    public function edit(LfgPost $lfgPost): Response
    {
        if ($lfgPost->user_id !== auth()->id()) {
            abort(403);
        }

        return Inertia::render('Lfg/Edit', [
            'post' => $lfgPost->load('game'),
            'games' => Game::all(),
        ]);
    }

    public function update(Request $request, LfgPost $lfgPost)
    {
        if ($lfgPost->user_id !== auth()->id()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'spots_needed' => 'required|integer|min:1|max:9',
            'platform' => 'required|string|max:50',
            'rank_min' => 'nullable|string|max:50',
            'mic_required' => 'nullable|boolean',
            'language' => 'nullable|string|max:50',
            'age_requirement' => 'nullable|string|max:20',
            'requirements_note' => 'nullable|string|max:500',
            'discord_url' => 'nullable|string|max:255',
            'scheduled_at' => 'nullable|date',
        ]);

        $lfgPost->update($validated);

        return redirect()->route('lfg.show', $lfgPost)->with('message', 'LFG post updated!');
    }

    public function close(LfgPost $lfgPost): JsonResponse
    {
        if ($lfgPost->user_id !== auth()->id()) {
            return response()->json(['error' => 'Only the creator can close.'], 403);
        }

        $lfgPost->update(['status' => 'closed']);
        return response()->json(['success' => true]);
    }

    public function repost(LfgPost $lfgPost)
    {
        if ($lfgPost->user_id !== auth()->id()) {
            abort(403);
        }

        $new = LfgPost::create([
            'user_id' => auth()->id(),
            'game_id' => $lfgPost->game_id,
            'title' => $lfgPost->title,
            'description' => $lfgPost->description,
            'spots_needed' => $lfgPost->spots_needed,
            'platform' => $lfgPost->platform,
            'rank_min' => $lfgPost->rank_min,
            'mic_required' => $lfgPost->mic_required,
            'language' => $lfgPost->language,
            'age_requirement' => $lfgPost->age_requirement,
            'requirements_note' => $lfgPost->requirements_note,
        ]);

        return redirect()->route('lfg.show', $new)->with('message', 'LFG reposted!');
    }
}
