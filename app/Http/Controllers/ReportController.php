<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /** Reports the viewer has submitted — closes the loop on "what happened?". */
    public function mine(): Response
    {
        $reports = Report::where('reporter_id', auth()->id())
            ->with([
                'reported.profile',
                'communityPost',
                'postComment.post',
                'lfgPost',
            ])
            ->latest()
            ->take(50)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'reason' => $r->reason,
                'details' => $r->details,
                'status' => $r->status,
                'created_at' => $r->created_at->diffForHumans(),
                'reported_name' => $r->reported?->profile?->username ?? $r->reported?->name,
                'target' => $this->describeTarget($r),
            ]);

        return Inertia::render('Reports/Mine', ['reports' => $reports]);
    }

    private function describeTarget(Report $r): ?array
    {
        if ($r->communityPost) {
            return ['type' => 'community_post', 'title' => $r->communityPost->title, 'url' => "/community/{$r->communityPost->slug}"];
        }
        if ($r->postComment) {
            return ['type' => 'post_comment', 'title' => 'Comment on: ' . ($r->postComment->post?->title ?? 'post'), 'url' => $r->postComment->post ? "/community/{$r->postComment->post->slug}" : null];
        }
        if ($r->lfgPost) {
            return ['type' => 'lfg_post', 'title' => $r->lfgPost->title, 'url' => "/lfg/{$r->lfgPost->slug}"];
        }
        return null;
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'reported_id' => ['required', 'integer', 'exists:users,id'],
            'lfg_post_id' => ['nullable', 'integer', 'exists:lfg_posts,id'],
            'community_post_id' => ['nullable', 'integer', 'exists:community_posts,id'],
            'post_comment_id' => ['nullable', 'integer', 'exists:post_comments,id'],
            'reason' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string', 'max:2000'],
        ]);

        $userId = auth()->id();
        $reportedId = (int) $request->reported_id;

        if ($reportedId === $userId) {
            return response()->json(['message' => 'You cannot report yourself.'], 422);
        }

        // Per-target cooldown (24h): one open report against the same
        // user is enough — a second report during the window gets
        // swallowed with a soft success so a troll can't spam-report
        // to overload moderation, but a genuine reporter doesn't see
        // a confusing error. Admin still sees the first report.
        $existingAgainstTarget = Report::where('reporter_id', $userId)
            ->where('reported_id', $reportedId)
            ->where('created_at', '>=', now()->subDay())
            ->exists();
        if ($existingAgainstTarget) {
            return response()->json(['message' => 'Report already on file — thanks for letting us know.']);
        }

        // Daily cap per reporter. Genuine users never hit this; a
        // report-bot tops out at 20/day from a single account.
        $today = Report::where('reporter_id', $userId)
            ->where('created_at', '>=', now()->startOfDay())
            ->count();
        if ($today >= 20) {
            return response()->json([
                'message' => 'You have reached the daily report limit. Contact support if you have more to flag.',
            ], 429);
        }

        Report::create([
            'reporter_id' => $userId,
            'reported_id' => $reportedId,
            'lfg_post_id' => $request->lfg_post_id,
            'community_post_id' => $request->community_post_id,
            'post_comment_id' => $request->post_comment_id,
            'reason' => $request->reason,
            'details' => $request->details,
        ]);

        return response()->json(['message' => 'Report submitted successfully.']);
    }
}
