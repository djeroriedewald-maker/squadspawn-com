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
        $viewer = auth()->user();
        $query = CommunityPost::with(['user.profile', 'game', 'hiddenBy.profile'])
            ->withCount('comments')
            ->visibleTo($viewer);

        if ($request->filled('game_id')) {
            $query->where('game_id', $request->input('game_id'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        // Pinned always first; then the chosen sort for the rest.
        $sort = $request->input('sort', 'hot');
        $query->orderByRaw('pinned_at IS NULL ASC')->orderByDesc('pinned_at');
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
            'canModerate' => $viewer ? $viewer->canModerate() : false,
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
        $viewer = auth()->user();

        // Hidden posts are invisible to regular users — mods/admins see them
        // (with a red-border indicator) so they can unhide if needed.
        if ($communityPost->hidden_at && !($viewer && $viewer->canModerate())) {
            abort(404);
        }

        $communityPost->load([
            'user.profile', 'game',
            'hiddenBy.profile',
            'comments.user.profile',
            'comments.hiddenBy.profile',
        ]);

        $userVote = null;
        if ($viewer) {
            $vote = PostVote::where('community_post_id', $communityPost->id)
                ->where('user_id', $viewer->id)
                ->first();
            $userVote = $vote?->vote;
        }

        $author = $communityPost->user->profile->username ?? $communityPost->user->name;
        $snippet = \Illuminate\Support\Str::limit(strip_tags($communityPost->body ?? ''), 160);

        return Inertia::render('Community/Show', [
            'post' => $communityPost,
            'userVote' => $userVote,
            'canModerate' => $viewer ? $viewer->canModerate() : false,
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
            'body' => 'required|string|max:20000', // body is the rich-text HTML
            'game_id' => 'nullable|exists:games,id',
            'type' => 'required|in:discussion,question,tip,team,news',
        ]);

        [$validated['body_html'], $validated['body']] = $this->sanitisePostBody($validated['body']);

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
            'body' => 'required|string|max:20000',
            'game_id' => 'nullable|exists:games,id',
            'type' => 'required|in:discussion,question,tip,team,news',
        ]);

        [$validated['body_html'], $validated['body']] = $this->sanitisePostBody($validated['body']);

        $communityPost->update($validated);

        return redirect()->route('community.show', $communityPost);
    }

    /**
     * Sanitise the Tiptap HTML through HTMLPurifier (community_post preset)
     * and return [html, plainText]. Logs and throws a validation exception
     * if the sanitiser explodes, which surfaces the real cause instead of
     * a generic 500.
     */
    private function sanitisePostBody(string $rawHtml): array
    {
        try {
            $html = clean($rawHtml, 'community_post');
        } catch (\Throwable $e) {
            \Log::error('HTMLPurifier failed on community post body', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Fallback: strip everything except the safest inline tags so
            // we still save something instead of blowing up the post.
            $html = strip_tags($rawHtml, '<p><br><strong><em><u><s><a><ul><ol><li><h2><h3><blockquote><code><pre><img>');
        }
        $plain = trim(strip_tags($html));
        return [$html, $plain];
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
        if ($communityPost->locked_at) {
            return response()->json(['error' => 'This thread is locked.'], 422);
        }
        if ($communityPost->hidden_at && !(auth()->user()?->canModerate())) {
            return response()->json(['error' => 'This post is no longer available.'], 404);
        }

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

    /** Team page — all admins + moderators, so users know who's enforcing. */
    public function team(): Response
    {
        $team = \App\Models\User::where(function ($q) {
                $q->where('is_admin', true)->orWhere('is_moderator', true);
            })
            ->where('is_banned', false)
            ->with('profile')
            ->orderByDesc('is_owner')
            ->orderByDesc('is_admin')
            ->orderBy('created_at')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->profile?->username,
                'avatar' => $u->profile?->avatar,
                'bio' => $u->profile?->bio,
                'is_owner' => (bool) $u->is_owner,
                'is_admin' => (bool) $u->is_admin,
                'is_moderator' => (bool) $u->is_moderator,
                'region' => $u->profile?->region,
            ]);

        return Inertia::render('Community/Team', ['team' => $team]);
    }

    /** Static community rules page. */
    public function guidelines(): Response
    {
        return Inertia::render('Community/Guidelines');
    }
}
