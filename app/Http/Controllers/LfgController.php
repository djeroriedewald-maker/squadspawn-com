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
        $viewer = auth()->user();
        $query = LfgPost::active()
            ->with(['user.profile', 'game', 'responses.user.profile']);

        if ($request->filled('game_id')) {
            $query->where('game_id', $request->input('game_id'));
        }
        if ($request->filled('platform')) {
            $query->where('platform', $request->input('platform'));
        }
        if ($request->filled('language')) {
            $query->where('language', $request->input('language'));
        }
        if ($request->boolean('mic_required')) {
            $query->where('mic_required', true);
        }
        if ($request->boolean('auto_accept')) {
            $query->where('auto_accept', true);
        }
        if ($request->filled('rank_min')) {
            $query->where('rank_min', $request->input('rank_min'));
        }
        // Host-region filter requires joining profiles. We always leftJoin
        // below for the relevance sort when a viewer is authed, but for
        // anonymous viewers we do it inline here.
        if ($request->filled('region')) {
            if (!$viewer) {
                $query->leftJoin('profiles as host_profile', 'host_profile.user_id', '=', 'lfg_posts.user_id')
                    ->select('lfg_posts.*');
            }
            $query->where('host_profile.region', $request->input('region'));
        }
        // Favourites-only filter — show posts whose host the viewer has starred.
        if ($viewer && $request->boolean('favorites')) {
            $favoriteIds = $viewer->favoriteHosts()->pluck('users.id');
            $query->whereIn('lfg_posts.user_id', $favoriteIds->isEmpty() ? [0] : $favoriteIds);
        }

        // Personalised "For You" sort — bump posts whose game the viewer
        // plays and whose host shares the viewer's region to the top, then
        // favour freshness as a tiebreak. Anonymous viewers fall back to
        // plain chronological order.
        if ($viewer) {
            $userGameIds = $viewer->games->pluck('id')->map(fn ($id) => (int) $id);
            $gameIdsList = $userGameIds->isNotEmpty() ? $userGameIds->implode(',') : '0';
            $userRegion = $viewer->profile?->region;

            $query->leftJoin('profiles as host_profile', 'host_profile.user_id', '=', 'lfg_posts.user_id')
                ->select('lfg_posts.*')
                ->selectRaw(
                    "(CASE WHEN lfg_posts.game_id IN ({$gameIdsList}) THEN 100 ELSE 0 END
                    + CASE WHEN host_profile.region IS NOT NULL AND host_profile.region = ? THEN 20 ELSE 0 END
                    + CASE WHEN lfg_posts.created_at > ? THEN 10 ELSE 0 END) AS relevance",
                    [$userRegion ?? '', now()->subHours(2)]
                )
                ->orderByDesc('relevance')
                ->orderByDesc('lfg_posts.created_at');
        } else {
            $query->latest();
        }

        $posts = $query->paginate(20)->withQueryString();

        // Host trust signals — sessions hosted + rating count + online now.
        // Batched up front so we don't N+1 per card.
        $hostIds = $posts->pluck('user_id')->unique();
        if ($hostIds->isNotEmpty()) {
            $hostedCounts = LfgPost::whereIn('user_id', $hostIds)
                ->where('status', 'closed')
                ->selectRaw('user_id, COUNT(*) as c')
                ->groupBy('user_id')
                ->pluck('c', 'user_id');
            // Reputation aggregates BOTH LfgRating and PlayerRating — match
            // that here so the star ⭐️ shows whenever there's actual rating
            // signal behind the reputation_score, regardless of source.
            $playerRatingCounts = \App\Models\PlayerRating::whereIn('rated_id', $hostIds)
                ->selectRaw('rated_id, COUNT(*) as c')
                ->groupBy('rated_id')
                ->pluck('c', 'rated_id');
            $lfgRatingCounts = \App\Models\LfgRating::whereIn('rated_id', $hostIds)
                ->selectRaw('rated_id, COUNT(*) as c')
                ->groupBy('rated_id')
                ->pluck('c', 'rated_id');

            $onlineCutoff = now()->subMinutes(10);

            // Personalised flags: is this host a favourite? Have we played
            // with them before (PlayerMatch)?
            $favoriteHostIds = $viewer
                ? $viewer->favoriteHosts()->whereIn('users.id', $hostIds)->pluck('users.id')->flip()
                : collect();
            $friendHostIds = collect();
            if ($viewer) {
                $friendHostIds = \App\Models\PlayerMatch::where(function ($q) use ($viewer, $hostIds) {
                    $q->where(function ($q2) use ($viewer, $hostIds) {
                        $q2->where('user_one_id', $viewer->id)->whereIn('user_two_id', $hostIds);
                    })->orWhere(function ($q2) use ($viewer, $hostIds) {
                        $q2->where('user_two_id', $viewer->id)->whereIn('user_one_id', $hostIds);
                    });
                })->get()->flatMap(fn ($m) => [$m->user_one_id, $m->user_two_id])->unique()->flip();
            }

            foreach ($posts as $post) {
                $post->host_stats = [
                    'sessions_hosted' => (int) ($hostedCounts[$post->user_id] ?? 0),
                    'rating_count' => (int) (($playerRatingCounts[$post->user_id] ?? 0) + ($lfgRatingCounts[$post->user_id] ?? 0)),
                    'is_online' => $post->user && $post->user->updated_at && $post->user->updated_at->greaterThanOrEqualTo($onlineCutoff),
                    'is_favorited' => $favoriteHostIds->has($post->user_id),
                    'is_friend' => $friendHostIds->has($post->user_id),
                ];
            }
        }

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

        // Distinct filter options from the live active-posts set, so filter
        // chips only show values that will actually match something.
        $filterOptions = [
            'languages' => LfgPost::active()->whereNotNull('language')->distinct()->pluck('language')->filter()->values(),
            'ranks' => LfgPost::active()->whereNotNull('rank_min')->distinct()->pluck('rank_min')->filter()->values(),
            'regions' => \App\Models\Profile::whereIn('user_id', LfgPost::active()->distinct()->pluck('user_id'))
                ->whereNotNull('region')->distinct()->pluck('region')->filter()->values(),
        ];

        return Inertia::render('Lfg/Index', [
            'posts' => $posts,
            'myPosts' => $myPosts,
            'myHistory' => $myHistory,
            'games' => Game::all(),
            'filters' => $request->only(['game_id', 'platform', 'language', 'rank_min', 'region', 'mic_required', 'auto_accept', 'favorites']),
            'filterOptions' => $filterOptions,
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
            'spots_needed' => 'required|integer|min:2|max:9',
            'platform' => 'required|string|max:50',
            'rank_min' => 'nullable|string|max:50',
            'mic_required' => 'nullable|boolean',
            'auto_accept' => 'nullable|boolean',
            'language' => 'nullable|string|max:50',
            'age_requirement' => 'nullable|string|max:20',
            'requirements_note' => 'nullable|string|max:500',
            'discord_url' => 'nullable|string|max:255',
            'scheduled_at' => 'nullable|date|after:now',
        ]);

        $validated['user_id'] = auth()->id();
        $validated['expires_at'] = now()->addHours(6);
        $validated['spots_filled'] = 1; // host counts as filled from the start
        $post = LfgPost::create($validated);

        try {
            AchievementService::awardXp(auth()->user(), 'lfg_hosted');
        } catch (\Throwable) {}
        app(AchievementService::class)->check(auth()->user());

        $this->notifyFavoriters($post);

        return redirect()->route('lfg.index')->with('message', 'LFG post created!');
    }

    /**
     * Fire a push + in-app notification to every user who favourited this
     * host. Swallowed per-user so one bad subscription doesn't block others.
     */
    private function notifyFavoriters(LfgPost $post): void
    {
        try {
            $post->loadMissing(['user.profile', 'game']);
            $favoriters = $post->user->favoritedBy()->get();
            foreach ($favoriters as $fan) {
                $fan->notify(new \App\Notifications\FavoriteHostPostedLfgNotification($post));
                Cache::forget("user:{$fan->id}:unread");
            }
        } catch (\Throwable $e) {
            \Log::error('notifyFavoriters error: ' . $e->getMessage());
        }
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

        // Host trust + relationship flags so the detail page shows the same
        // signals as the feed card.
        $hostId = $lfgPost->user_id;
        $hostStats = [
            'sessions_hosted' => LfgPost::where('user_id', $hostId)->where('status', 'closed')->count(),
            'rating_count' => \App\Models\PlayerRating::where('rated_id', $hostId)->count()
                + \App\Models\LfgRating::where('rated_id', $hostId)->count(),
            'is_online' => $lfgPost->user && $lfgPost->user->updated_at && $lfgPost->user->updated_at->greaterThanOrEqualTo(now()->subMinutes(10)),
            'is_favorited' => $user->favoriteHosts()->where('users.id', $hostId)->exists(),
            'is_friend' => \App\Models\PlayerMatch::where(function ($q) use ($user, $hostId) {
                $q->where(function ($q2) use ($user, $hostId) {
                    $q2->where('user_one_id', $user->id)->where('user_two_id', $hostId);
                })->orWhere(function ($q2) use ($user, $hostId) {
                    $q2->where('user_two_id', $user->id)->where('user_one_id', $hostId);
                });
            })->exists(),
        ];

        return Inertia::render('Lfg/Show', [
            'post' => $lfgPost,
            'hostStats' => $hostStats,
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

        // Auto-accept path: host opted into first-come-first-served, so we
        // instantly take the spot inside a transaction to avoid two people
        // claiming the last slot at the same instant.
        if ($lfgPost->auto_accept) {
            $result = DB::transaction(function () use ($lfgPost, $request) {
                $locked = LfgPost::whereKey($lfgPost->id)->lockForUpdate()->first();
                if (!$locked || $locked->status !== 'open') {
                    return ['error' => 'This post is no longer open.', 'code' => 422];
                }
                if ($locked->spots_filled >= $locked->spots_needed) {
                    return ['error' => 'This squad just filled up.', 'code' => 422];
                }

                $locked->responses()->create([
                    'user_id' => auth()->id(),
                    'message' => $request->input('message'),
                    'status' => 'accepted',
                ]);

                $newFilled = $locked->spots_filled + 1;
                $newStatus = $newFilled >= $locked->spots_needed ? 'full' : 'open';
                $locked->update(['spots_filled' => $newFilled, 'status' => $newStatus]);

                return ['ok' => true, 'post' => $locked];
            });

            if (isset($result['error'])) {
                return response()->json(['error' => $result['error']], $result['code']);
            }

            // Notifications outside the transaction.
            try {
                $lfgPost->refresh()->load(['user', 'game']);
                $lfgPost->user->notify(new LfgNewRequestNotification($lfgPost, auth()->user()));
                Cache::forget("user:{$lfgPost->user_id}:unread");
                auth()->user()->notify(new LfgAcceptedNotification($lfgPost));
            } catch (\Throwable $e) {
                \Log::error('LFG auto-accept notification error: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'auto_accepted' => true, 'status' => $result['post']->status]);
        }

        // Manual-approval path: create a pending response, wait for the host.
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

        \Log::info('LFG rate attempt', [
            'user_id' => $user->id,
            'post_id' => $lfgPost->id,
            'post_slug' => $lfgPost->slug,
            'is_host' => $lfgPost->user_id === $user->id,
            'input' => $request->all(),
        ]);

        // Verify rater is a member (host or accepted participant)
        if (!$this->isMember($lfgPost, $user->id)) {
            \Log::warning('LFG rate: not a member', ['user_id' => $user->id, 'post_id' => $lfgPost->id]);
            return response()->json(['error' => 'Only group members can rate.'], 403);
        }

        $validTags = ['great_teammate', 'good_comms', 'skilled', 'friendly', 'toxic', 'no_show'];

        $validated = $request->validate([
            'rated_id' => ['required', 'integer', 'exists:users,id'],
            'score' => ['required', 'integer', 'min:1', 'max:5'],
            'tag' => ['nullable', 'string'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'in:' . implode(',', $validTags)],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        if ((int) $validated['rated_id'] === $user->id) {
            return response()->json(['error' => 'You cannot rate yourself.'], 422);
        }

        // Support multiple tags: store as comma-separated string
        $tags = $validated['tags'] ?? [];
        if (empty($tags) && !empty($validated['tag'])) {
            $tags = [$validated['tag']];
        }
        $tagString = !empty($tags) ? implode(',', $tags) : null;

        try {
            $rating = LfgRating::updateOrCreate(
                [
                    'lfg_post_id' => $lfgPost->id,
                    'rater_id' => $user->id,
                    'rated_id' => (int) $validated['rated_id'],
                ],
                [
                    'score' => (int) $validated['score'],
                    'tag' => $tagString,
                    'comment' => $validated['comment'] ?? null,
                ]
            );

            \Log::info('LFG rating saved', ['rating_id' => $rating->id, 'score' => $rating->score]);

            // XP for rating
            AchievementService::awardXp($user, 'rating_given');
            if ((int) $validated['score'] === 5) {
                $ratedUser = \App\Models\User::find($validated['rated_id']);
                if ($ratedUser) AchievementService::awardXp($ratedUser, 'rating_received_5star');
            }
        } catch (\Throwable $e) {
            \Log::error('LFG rating save failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to save rating. Please try again.'], 500);
        }

        // Auto-recalculate the rated user's reputation (non-blocking)
        try {
            $ratedUser = \App\Models\User::find($validated['rated_id']);
            if ($ratedUser) {
                app(\App\Services\ReputationService::class)->calculate($ratedUser);
            }
        } catch (\Throwable $e) {
            \Log::error('Reputation recalc failed: ' . $e->getMessage());
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
            'spots_needed' => 'required|integer|min:2|max:9',
            'platform' => 'required|string|max:50',
            'rank_min' => 'nullable|string|max:50',
            'mic_required' => 'nullable|boolean',
            'auto_accept' => 'nullable|boolean',
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
        $lfgPost->load(['user.profile', 'game']);

        // Notify all accepted members to rate their teammates
        try {
            $acceptedMembers = $lfgPost->responses()
                ->where('status', 'accepted')
                ->with('user')
                ->get();

            foreach ($acceptedMembers as $response) {
                $response->user->notify(new \App\Notifications\LfgSessionEndedNotification($lfgPost));
                \Cache::forget("user:{$response->user_id}:unread");
            }
        } catch (\Throwable $e) {
            \Log::error('LFG close notification error: ' . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }

    /**
     * Hard-delete an LFG post the creator made by mistake. Allowed only as
     * long as nobody has been accepted into the group yet — once people are
     * in, use close() so everyone can still rate each other.
     */
    public function destroy(LfgPost $lfgPost)
    {
        if ($lfgPost->user_id !== auth()->id()) {
            abort(403);
        }

        $acceptedCount = $lfgPost->responses()->where('status', 'accepted')->count();
        if ($acceptedCount > 0) {
            return redirect()
                ->route('lfg.show', $lfgPost)
                ->with('message', "Je kunt deze post niet meer verwijderen — er zijn al {$acceptedCount} teammates geaccepteerd. Sluit de sessie in plaats daarvan.");
        }

        $lfgPost->delete(); // FK cascade wipes pending responses + any messages

        return redirect()->route('lfg.index')->with('message', 'LFG-post verwijderd.');
    }

    public function repost(Request $request, LfgPost $lfgPost)
    {
        if ($lfgPost->user_id !== auth()->id()) {
            abort(403);
        }

        $inviteSquad = $request->boolean('invite_squad');

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
            'expires_at' => now()->addHours(6),
            'spots_filled' => 1,
        ]);

        // Squad-up: ping previous teammates only when the host explicitly
        // opted in via the "with squad" variant — otherwise the host wanted
        // fresh faces and we shouldn't drag the old group back in.
        $message = 'LFG reposted!';
        if ($inviteSquad) {
            try {
                $previousTeammates = $lfgPost->responses()
                    ->where('status', 'accepted')
                    ->with('user')
                    ->get()
                    ->pluck('user')
                    ->filter();
                foreach ($previousTeammates as $mate) {
                    $mate->notify(new \App\Notifications\SquadInviteNotification($new));
                    Cache::forget("user:{$mate->id}:unread");
                }
                if ($previousTeammates->isNotEmpty()) {
                    $message = "LFG reposted! Previous squad pinged ({$previousTeammates->count()}).";
                }
            } catch (\Throwable $e) {
                \Log::error('SquadInvite dispatch error: ' . $e->getMessage());
            }
        }

        // Favourite-host listeners hear about every repost either way.
        $this->notifyFavoriters($new);

        // XHR callers (axios/fetch) expect JSON so the client can navigate
        // explicitly — Inertia redirect-following occasionally leaves the
        // user on the old page after POST, so we route around it.
        if ($request->wantsJson()) {
            return response()->json(['slug' => $new->slug, 'message' => $message]);
        }

        return redirect()->route('lfg.show', $new)->with('message', $message);
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

                // Pending requests (only for host)
                $pendingRequests = [];
                if ($post->user_id === $userId) {
                    $pendingRequests = $post->responses()
                        ->where('status', 'pending')
                        ->with('user.profile')
                        ->get()
                        ->map(fn ($r) => [
                            'id' => $r->id,
                            'user_id' => $r->user_id,
                            'message' => $r->message,
                            'username' => $r->user?->profile?->username ?? $r->user?->name,
                            'avatar' => $r->user?->profile?->avatar,
                        ])
                        ->toArray();
                }

                return [
                    'id' => $post->id,
                    'slug' => $post->slug,
                    'title' => $post->title,
                    'status' => $post->status,
                    'game_name' => $post->game?->name,
                    'game_cover' => $post->game?->cover_image,
                    'member_count' => $post->member_count + 1,
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
                    'pending_requests' => $pendingRequests,
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
