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
        return response()->json(['ok' => true]);
    }

    public function clicked(int $broadcastId, Request $request): JsonResponse
    {
        $row = BroadcastView::where('broadcast_id', $broadcastId)
            ->where('user_id', $request->user()->id)
            ->first();
        if ($row && !$row->clicked_at) {
            $row->update(['clicked_at' => now()]);
        }
        return response()->json(['ok' => true]);
    }
}
