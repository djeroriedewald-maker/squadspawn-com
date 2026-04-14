<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\LfgMessage;
use App\Models\LfgPost;
use App\Models\LfgRating;
use App\Notifications\LfgAcceptedNotification;
use App\Notifications\LfgNewRequestNotification;
use App\Services\AchievementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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

        $userId = auth()->id();

        $myPosts = LfgPost::where('user_id', $userId)
            ->whereIn('status', ['open', 'full'])
            ->with(['game', 'responses.user.profile'])
            ->latest()
            ->get();

        // History: closed groups I hosted or participated in
        $myHistory = LfgPost::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)
                ->orWhereHas('responses', fn ($r) => $r->where('user_id', $userId)->where('status', 'accepted'));
        })
            ->where('status', 'closed')
            ->with(['game', 'user.profile', 'responses' => fn ($q) => $q->where('status', 'accepted')->with('user.profile'), 'ratings'])
            ->withCount(['responses as member_count' => fn ($q) => $q->where('status', 'accepted')])
            ->latest()
            ->take(20)
            ->get()
            ->map(function (LfgPost $post) use ($userId) {
                $myRatingsGiven = $post->ratings->where('rater_id', $userId)->count();
                $myRatingsReceived = $post->ratings->where('rated_id', $userId);
                $avgReceived = $myRatingsReceived->count() > 0 ? round($myRatingsReceived->avg('score'), 1) : null;

                return [
                    'id' => $post->id,
                    'slug' => $post->slug,
                    'title' => $post->title,
                    'game' => $post->game,
                    'platform' => $post->platform,
                    'spots_needed' => $post->spots_needed,
                    'member_count' => $post->member_count + 1,
                    'is_host' => $post->user_id === $userId,
                    'host' => $post->user,
                    'created_at' => $post->created_at->diffForHumans(),
                    'ratings_given' => $myRatingsGiven,
                    'avg_received' => $avgReceived,
                ];
            });

        return Inertia::render('Lfg/Index', [
            'posts' => $posts,
            'myPosts' => $myPosts,
            'myHistory' => $myHistory,
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
        $isMember = $this->isMember($lfgPost, $user->id);

        $myRatings = LfgRating::where('lfg_post_id', $lfgPost->id)
            ->where('rater_id', $user->id)
            ->pluck('rated_id')
            ->toArray();

        // Mark LFG notifications as read
        $user->unreadNotifications()
            ->get()
            ->filter(fn ($n) => ($n->data['lfg_post_id'] ?? null) === $lfgPost->id)
            ->each->markAsRead();
        Cache::forget("user:{$user->id}:unread");

        // Mark chat as read for widget unread tracking
        Cache::put("lfg_read:{$user->id}:{$lfgPost->id}", now()->toISOString(), 86400 * 30);

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

        // Notify the host
        try {
            $lfgPost->load(['user', 'game']);
            $lfgPost->user->notify(new LfgNewRequestNotification($lfgPost, auth()->user()));
            Cache::forget("user:{$lfgPost->user_id}:unread");
        } catch (\Throwable $e) {
            \Log::error('LFG request notification error: ' . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }

    public function acceptResponse(LfgPost $lfgPost, int $responseId): JsonResponse
    {
        if ($lfgPost->user_id !== auth()->id()) {
            return response()->json(['error' => 'Only the creator can manage responses.'], 403);
        }

        // Use transaction to prevent race conditions
        return DB::transaction(function () use ($lfgPost, $responseId) {
            $response = $lfgPost->responses()->lockForUpdate()->findOrFail($responseId);
            $response->update(['status' => 'accepted']);

            $acceptedCount = $lfgPost->responses()->where('status', 'accepted')->count();
            $spotsFilled = $acceptedCount + 1; // +1 for host

            $status = $spotsFilled >= $lfgPost->spots_needed ? 'full' : $lfgPost->status;
            $lfgPost->update(['spots_filled' => $spotsFilled, 'status' => $status]);

            // Notify the accepted user
            try {
                $lfgPost->load(['user', 'game']);
                $acceptedUser = $response->user;
                $acceptedUser->notify(new LfgAcceptedNotification($lfgPost));
                Cache::forget("user:{$acceptedUser->id}:unread");
            } catch (\Throwable $e) {
                \Log::error('LFG accept notification error: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'status' => $status]);
        });
    }

    public function rejectResponse(LfgPost $lfgPost, int $responseId): JsonResponse
    {
        if ($lfgPost->user_id !== auth()->id()) {
            return response()->json(['error' => 'Only the creator can manage responses.'], 403);
        }

        $response = $lfgPost->responses()->findOrFail($responseId);
        $response->update(['status' => 'rejected']);

        // Recalculate spots and reopen if was full
        $acceptedCount = $lfgPost->responses()->where('status', 'accepted')->count();
        $spotsFilled = $acceptedCount + 1;
        $status = $lfgPost->status;

        // If group was full and now has room, reopen it
        if ($status === 'full' && $spotsFilled < $lfgPost->spots_needed) {
            $status = 'open';
        }

        $lfgPost->update(['spots_filled' => $spotsFilled, 'status' => $status]);

        return response()->json(['success' => true, 'status' => $status]);
    }

    public function sendMessage(Request $request, LfgPost $lfgPost): JsonResponse
    {
        $user = auth()->user();

        if (!$this->isMember($lfgPost, $user->id)) {
            return response()->json(['error' => 'Only group members can chat.'], 403);
        }

        $validated = $request->validate(['body' => 'required|string|max:1000']);

        $message = $lfgPost->messages()->create([
            'user_id' => $user->id,
            'body' => $validated['body'],
        ]);
        $message->load('user.profile');

        // Update sender's read timestamp
        Cache::put("lfg_read:{$user->id}:{$lfgPost->id}", now()->toISOString(), 86400 * 30);

        return response()->json($message, 201);
    }

    public function pollMessages(Request $request, LfgPost $lfgPost): JsonResponse
    {
        $user = auth()->user();

        if (!$this->isMember($lfgPost, $user->id)) {
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
        $user = auth()->user();

        // Verify rater is a member
        if (!$this->isMember($lfgPost, $user->id)) {
            return response()->json(['error' => 'Only group members can rate.'], 403);
        }

        $validTags = ['great_teammate', 'good_comms', 'skilled', 'friendly', 'toxic', 'no_show'];

        $validated = $request->validate([
            'rated_id' => 'required|exists:users,id',
            'score' => 'required|integer|min:1|max:5',
            'tag' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'in:' . implode(',', $validTags)],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        if ((int) $validated['rated_id'] === $user->id) {
            return response()->json(['error' => 'You cannot rate yourself.'], 422);
        }

        // Support multiple tags: store as comma-separated string
        $tags = $validated['tags'] ?? ($validated['tag'] ? [$validated['tag']] : []);
        $tagString = !empty($tags) ? implode(',', $tags) : null;

        LfgRating::updateOrCreate(
            [
                'lfg_post_id' => $lfgPost->id,
                'rater_id' => $user->id,
                'rated_id' => $validated['rated_id'],
            ],
            [
                'score' => $validated['score'],
                'tag' => $tagString,
                'comment' => $validated['comment'] ?? null,
            ]
        );

        // Auto-recalculate the rated user's reputation immediately
        $ratedUser = \App\Models\User::find($validated['rated_id']);
        if ($ratedUser) {
            app(\App\Services\ReputationService::class)->calculate($ratedUser);
        }

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

    // ── Widget endpoints ──────────────────────────────────────────

    /**
     * Return user's active LFG groups for the floating chat widget.
     */
    public function myGroups(): JsonResponse
    {
        $userId = auth()->id();

        $groups = LfgPost::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)
                ->orWhereHas('responses', fn ($r) => $r->where('user_id', $userId)->where('status', 'accepted'));
        })
            ->whereIn('status', ['open', 'full', 'closed'])
            ->with(['user.profile', 'game'])
            ->withCount(['responses as member_count' => fn ($q) => $q->where('status', 'accepted')])
            ->latest()
            ->take(20)
            ->get()
            ->map(function (LfgPost $post) use ($userId) {
                $lastMessage = $post->messages()->with('user.profile')->latest()->first();

                // Unread count: messages since user last read this chat
                $lastRead = Cache::get("lfg_read:{$userId}:{$post->id}", '1970-01-01');
                $unreadCount = LfgMessage::where('lfg_post_id', $post->id)
                    ->where('user_id', '!=', $userId)
                    ->where('created_at', '>', $lastRead)
                    ->count();

                return [
                    'id' => $post->id,
                    'slug' => $post->slug,
                    'title' => $post->title,
                    'status' => $post->status,
                    'game_name' => $post->game?->name,
                    'game_cover' => $post->game?->cover_image,
                    'member_count' => $post->member_count + 1, // +1 for host
                    'spots_needed' => $post->spots_needed,
                    'is_host' => $post->user_id === $userId,
                    'host' => [
                        'name' => $post->user?->name,
                        'username' => $post->user?->profile?->username,
                        'avatar' => $post->user?->profile?->avatar,
                    ],
                    'last_message' => $lastMessage ? [
                        'body' => $lastMessage->body,
                        'user_name' => $lastMessage->user?->profile?->username ?? $lastMessage->user?->name,
                        'created_at' => $lastMessage->created_at->diffForHumans(),
                    ] : null,
                    'unread_count' => $unreadCount,
                ];
            });

        return response()->json(['groups' => $groups]);
    }

    /**
     * Return messages for a specific LFG post (used by floating chat widget).
     */
    public function widgetMessages(LfgPost $lfgPost): JsonResponse
    {
        $user = auth()->user();

        if (!$this->isMember($lfgPost, $user->id)) {
            return response()->json(['error' => 'Only group members can view chat.'], 403);
        }

        $messages = $lfgPost->messages()
            ->with('user.profile')
            ->orderBy('created_at')
            ->take(50)
            ->get();

        // Mark as read
        Cache::put("lfg_read:{$user->id}:{$lfgPost->id}", now()->toISOString(), 86400 * 30);

        // Clear LFG notifications for this post
        $user->unreadNotifications()
            ->get()
            ->filter(fn ($n) => ($n->data['lfg_post_id'] ?? null) === $lfgPost->id)
            ->each->markAsRead();
        Cache::forget("user:{$user->id}:unread");

        return response()->json([
            'messages' => $messages,
            'timestamp' => now()->toISOString(),
        ]);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private function isMember(LfgPost $lfgPost, int $userId): bool
    {
        return $lfgPost->user_id === $userId
            || $lfgPost->responses()->where('user_id', $userId)->where('status', 'accepted')->exists();
    }
}
