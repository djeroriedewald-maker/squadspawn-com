<?php

namespace App\Http\Controllers;

use App\Models\Broadcast;
use App\Models\BroadcastView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BroadcastViewController extends Controller
{
    /** User's announcement history. */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $views = BroadcastView::where('user_id', $user->id)
            ->with('broadcast')
            ->latest('id')
            ->take(50)
            ->get()
            ->filter(fn ($v) => $v->broadcast && $v->broadcast->sent_at)
            ->map(fn (BroadcastView $v) => [
                'id' => $v->id,
                'broadcast_id' => $v->broadcast_id,
                'title' => $v->broadcast->title,
                'body_html' => $v->broadcast->body_html,
                'cta_label' => $v->broadcast->cta_label,
                'cta_url' => $v->broadcast->cta_url,
                'image_url' => $v->broadcast->image_path ? '/storage/' . $v->broadcast->image_path : null,
                'youtube_id' => $v->broadcast->youtubeId(),
                'sent_at' => $v->broadcast->sent_at?->toIso8601String(),
                'sent_at_human' => $v->broadcast->sent_at?->diffForHumans(),
                'viewed_at' => $v->viewed_at?->toIso8601String(),
            ])
            ->values();

        return Inertia::render('Announcements/Index', [
            'views' => $views,
        ]);
    }

    public function markViewed(int $broadcastId, Request $request): JsonResponse
    {
        $row = BroadcastView::where('broadcast_id', $broadcastId)
            ->where('user_id', $request->user()->id)
            ->first();
        if ($row && !$row->viewed_at) {
            $row->update(['viewed_at' => now()]);
        }
        return response()->json(['ok' => true]);
    }

    public function dismiss(int $broadcastId, Request $request): JsonResponse
    {
        $row = BroadcastView::where('broadcast_id', $broadcastId)
            ->where('user_id', $request->user()->id)
            ->first();
        if ($row && !$row->dismissed_at) {
            $row->update(['dismissed_at' => now()]);
        }
        $this->markNotificationRead($request->user(), $broadcastId);
        return response()->json(['ok' => true]);
    }

    public function clicked(int $broadcastId, Request $request): JsonResponse
    {
        $row = BroadcastView::where('broadcast_id', $broadcastId)
            ->where('user_id', $request->user()->id)
            ->first();
        if ($row) {
            // A CTA click both records engagement (clicked_at) and
            // implicitly dismisses the popup. Setting both in the same
            // request means the browser can navigate away before a
            // second request completes without the popup re-appearing.
            $updates = [];
            if (!$row->clicked_at) $updates['clicked_at'] = now();
            if (!$row->dismissed_at) $updates['dismissed_at'] = now();
            if (!empty($updates)) $row->update($updates);
        }
        $this->markNotificationRead($request->user(), $broadcastId);
        return response()->json(['ok' => true]);
    }

    /**
     * Clear the database-channel notification row for this broadcast,
     * so the user doesn't also see it lingering under Alerts after
     * they've already interacted with the popup. We filter in PHP to
     * avoid JSON-path DB dialect issues (same pattern LFG uses).
     */
    private function markNotificationRead($user, int $broadcastId): void
    {
        $user->unreadNotifications()
            ->get()
            ->filter(fn ($n) => ($n->data['broadcast_id'] ?? null) === $broadcastId)
            ->each->markAsRead();
        \Illuminate\Support\Facades\Cache::forget("user:{$user->id}:unread");
    }
}
