<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
use App\Models\Game;
use App\Models\PostComment;
use App\Models\PostVote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    public function index(Request $request): Response
    {
        $query = CommunityPost::with(['user.profile', 'game'])
            ->withCount('comments');

        if ($request->filled('game_id')) {
            $query->where('game_id', $request->input('game_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        $sort = $request->input('sort', 'hot');
        if ($sort === 'new') {
            $query->new();
        } else {
            $query->hot();
        }

        $posts = $query->paginate(20)->withQueryString();

        // Get current user's votes for displayed posts
        $userVotes = [];
        if (auth()->check()) {
            $postIds = $posts->pluck('id');
            $userVotes = PostVote::where('user_id', auth()->id())
                ->whereIn('community_post_id', $postIds)
                ->pluck('vote', 'community_post_id')
                ->toArray();
        }

        return Inertia::render('Community/Index', [
            'posts' => $posts,
            'games' => Game::all(),
            'filters' => $request->only(['game_id', 'type', 'sort']),
            'userVotes' => $userVotes,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Community/Create', [
            'games' => Game::all(),
        ]);
    }

    public function show(CommunityPost $communityPost): Response
    {
        $communityPost->load(['user.profile', 'game', 'comments.user.profile']);

        $userVote = null;
        if (auth()->check()) {
            $vote = PostVote::where('community_post_id', $communityPost->id)
                ->where('user_id', auth()->id())
                ->first();
            $userVote = $vote?->vote;
        }

        $author = $communityPost->user->profile->username ?? $communityPost->user->name;
        $snippet = \Illuminate\Support\Str::limit(strip_tags($communityPost->body ?? ''), 160);

        return Inertia::render('Community/Show', [
            'post' => $communityPost,
            'userVote' => $userVote,
            'seo' => [
                'title' => "{$communityPost->title} · SquadSpawn Community",
                'description' => $snippet ?: "Community post by {$author} on SquadSpawn.",
                'type' => 'article',
            ],
            'jsonLd' => [
                '@context' => 'https://schema.org',
                '@type' => 'DiscussionForumPosting',
                'headline' => $communityPost->title,
                'author' => ['@type' => 'Person', 'name' => $author],
                'datePublished' => $communityPost->created_at?->toAtomString(),
                'url' => url("/community/{$communityPost->id}"),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
            'game_id' => 'nullable|exists:games,id',
            'type' => 'required|in:discussion,question,tip,team,news',
        ]);

        $post = CommunityPost::create([
            ...$validated,
            'user_id' => auth()->id(),
        ]);

        return redirect()->route('community.show', $post);
    }

    public function edit(CommunityPost $communityPost): Response
    {
        abort_unless($communityPost->user_id === auth()->id(), 403);

        return Inertia::render('Community/Edit', [
            'post' => $communityPost,
            'games' => \App\Models\Game::orderBy('name')->get(['id', 'name', 'slug', 'cover_image', 'genre', 'platforms']),
        ]);
    }

    public function update(Request $request, CommunityPost $communityPost)
    {
        abort_unless($communityPost->user_id === auth()->id(), 403);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
            'game_id' => 'nullable|exists:games,id',
            'type' => 'required|in:discussion,question,tip,team,news',
        ]);

        $communityPost->update($validated);

        return redirect()->route('community.show', $communityPost);
    }

    public function destroy(CommunityPost $communityPost)
    {
        abort_unless($communityPost->user_id === auth()->id(), 403);

        $communityPost->comments()->delete();
        $communityPost->votes()->delete();
        $communityPost->delete();

        return redirect()->route('community.index');
    }

    public function vote(Request $request, CommunityPost $communityPost): JsonResponse
    {
        $request->validate([
            'vote' => 'required|in:1,-1',
        ]);

        $voteValue = (int) $request->input('vote');

        // Use transaction to prevent race conditions
        \DB::transaction(function () use ($communityPost, $voteValue) {
            $existing = PostVote::where('community_post_id', $communityPost->id)
                ->where('user_id', auth()->id())
                ->lockForUpdate()
                ->first();

            if ($existing) {
                if ($existing->vote === $voteValue) {
                    if ($voteValue === 1) { $communityPost->decrement('upvotes'); }
                    else { $communityPost->decrement('downvotes'); }
                    $existing->delete();
                } else {
                    if ($voteValue === 1) { $communityPost->increment('upvotes'); $communityPost->decrement('downvotes'); }
                    else { $communityPost->decrement('upvotes'); $communityPost->increment('downvotes'); }
                    $existing->update(['vote' => $voteValue]);
                }
            } else {
                PostVote::create([
                    'community_post_id' => $communityPost->id,
                    'user_id' => auth()->id(),
                    'vote' => $voteValue,
                ]);
                if ($voteValue === 1) { $communityPost->increment('upvotes'); }
                else { $communityPost->increment('downvotes'); }
            }
        });

        $communityPost->refresh();

        return response()->json([
            'upvotes' => $communityPost->upvotes,
            'downvotes' => $communityPost->downvotes,
        ]);
    }

    public function comment(Request $request, CommunityPost $communityPost): JsonResponse
    {
        $validated = $request->validate([
            'body' => 'required|string|max:2000',
        ]);

        $comment = PostComment::create([
            'community_post_id' => $communityPost->id,
            'user_id' => auth()->id(),
            'body' => $validated['body'],
        ]);

        $communityPost->increment('comments_count');
        $comment->load('user.profile');

        return response()->json($comment, 201);
    }

    public function destroyComment(PostComment $postComment): JsonResponse
    {
        if ($postComment->user_id !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized.'], 403);
        }

        $postComment->post->decrement('comments_count');
        $postComment->delete();

        return response()->json(['success' => true]);
    }
}
