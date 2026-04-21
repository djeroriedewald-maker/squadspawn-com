<?php

namespace App\Http\Controllers;

use App\Models\CommunityPost;
use App\Models\ModerationAction;
use App\Models\PostComment;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ModerationController extends Controller
{
    // ── Posts ─────────────────────────────────────────────────────────

    public function hidePost(Request $request, CommunityPost $post): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $post->update([
            'hidden_at' => now(),
            'hidden_by_user_id' => auth()->id(),
            'hidden_reason' => $data['reason'] ?? null,
        ]);
        $this->log('hide_post', 'community_post', $post->id, $data['reason'] ?? null);

        return response()->json(['success' => true]);
    }

    public function unhidePost(CommunityPost $post): JsonResponse
    {
        $post->update(['hidden_at' => null, 'hidden_by_user_id' => null, 'hidden_reason' => null]);
        $this->log('unhide_post', 'community_post', $post->id);

        return response()->json(['success' => true]);
    }

    public function lockPost(CommunityPost $post): JsonResponse
    {
        $post->update(['locked_at' => now()]);
        $this->log('lock_post', 'community_post', $post->id);

        return response()->json(['success' => true]);
    }

    public function unlockPost(CommunityPost $post): JsonResponse
    {
        $post->update(['locked_at' => null]);
        $this->log('unlock_post', 'community_post', $post->id);

        return response()->json(['success' => true]);
    }

    public function pinPost(CommunityPost $post): JsonResponse
    {
        $post->update(['pinned_at' => now()]);
        $this->log('pin_post', 'community_post', $post->id);

        return response()->json(['success' => true]);
    }

    public function unpinPost(CommunityPost $post): JsonResponse
    {
        $post->update(['pinned_at' => null]);
        $this->log('unpin_post', 'community_post', $post->id);

        return response()->json(['success' => true]);
    }

    // ── Comments ──────────────────────────────────────────────────────

    public function hideComment(Request $request, PostComment $comment): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $comment->update([
            'hidden_at' => now(),
            'hidden_by_user_id' => auth()->id(),
            'hidden_reason' => $data['reason'] ?? null,
        ]);
        $this->log('hide_comment', 'post_comment', $comment->id, $data['reason'] ?? null);

        return response()->json(['success' => true]);
    }

    public function unhideComment(PostComment $comment): JsonResponse
    {
        $comment->update(['hidden_at' => null, 'hidden_by_user_id' => null, 'hidden_reason' => null]);
        $this->log('unhide_comment', 'post_comment', $comment->id);

        return response()->json(['success' => true]);
    }

    // ── LFG posts ─────────────────────────────────────────────────────

    public function hideLfg(Request $request, \App\Models\LfgPost $lfgPost): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $lfgPost->update([
            'hidden_at' => now(),
            'hidden_by_user_id' => auth()->id(),
            'hidden_reason' => $data['reason'] ?? null,
        ]);
        $this->log('hide_lfg', 'lfg_post', $lfgPost->id, $data['reason'] ?? null);

        return response()->json(['success' => true]);
    }

    public function unhideLfg(\App\Models\LfgPost $lfgPost): JsonResponse
    {
        $lfgPost->update(['hidden_at' => null, 'hidden_by_user_id' => null, 'hidden_reason' => null]);
        $this->log('unhide_lfg', 'lfg_post', $lfgPost->id);

        return response()->json(['success' => true]);
    }

    /**
     * Force-close an LFG session. Preserves chat + ratings for accepted
     * members (same as the host clicking End Session). Destructive delete
     * stays admin-only.
     */
    public function closeLfg(Request $request, \App\Models\LfgPost $lfgPost): JsonResponse
    {
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        if ($lfgPost->status !== 'closed') {
            $lfgPost->update(['status' => 'closed']);

            // Mirror the host's close flow — ping accepted members to rate.
            try {
                $accepted = $lfgPost->responses()->where('status', 'accepted')->with('user')->get();
                foreach ($accepted as $r) {
                    $r->user?->notify(new \App\Notifications\LfgSessionEndedNotification($lfgPost->loadMissing('game', 'user.profile')));
                    \Illuminate\Support\Facades\Cache::forget("user:{$r->user_id}:unread");
                }
            } catch (\Throwable $e) {
                \Log::error('Mod closeLfg notify failed: ' . $e->getMessage());
            }
        }

        $this->log('close_lfg', 'lfg_post', $lfgPost->id, $data['reason'] ?? null);

        return response()->json(['success' => true]);
    }

    // ── Mod queue ─────────────────────────────────────────────────────

    /**
     * Combined view of reports scoped to community content + recent mod
     * actions, so mods/admins have a single place to look.
     */
    public function queue(Request $request): Response
    {
        $reports = Report::with([
                'reporter.profile', 'reported.profile',
                'communityPost.game', 'postComment.post', 'postComment.user.profile',
                'lfgPost.game',
            ])
            ->where(function ($q) {
                $q->whereNotNull('community_post_id')
                    ->orWhereNotNull('post_comment_id')
                    ->orWhereNotNull('lfg_post_id');
            })
            ->where('status', 'pending')
            ->latest()
            ->take(50)
            ->get();

        $recentActions = ModerationAction::with('moderator.profile')
            ->latest()
            ->take(30)
            ->get();

        return Inertia::render('Mod/Queue', [
            'reports' => $reports,
            'recentActions' => $recentActions,
        ]);
    }

    private function log(string $action, string $targetType, int $targetId, ?string $reason = null): void
    {
        ModerationAction::create([
            'moderator_id' => auth()->id(),
            'action' => $action,
            'target_type' => $targetType,
            'target_id' => $targetId,
            'reason' => $reason,
        ]);
    }
}
