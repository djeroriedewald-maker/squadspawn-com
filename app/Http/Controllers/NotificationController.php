<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    /**
     * Return unread count + latest notifications for live polling.
     */
    public function poll(): JsonResponse
    {
        $user = auth()->user();

        // Alerts tab + badge exclude chat-message notifications. A chat
        // message already surfaces in the Chats tab and is counted there;
        // mirroring it here caused the badge to double up (1 message = 2).
        $base = $user->unreadNotifications()
            ->where('data->type', '!=', 'new_message');

        $notifications = (clone $base)
            ->take(15)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'data' => $n->data,
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'unreadCount' => $base->count(),
            'notifications' => $notifications,
        ]);
    }

    public function markAllRead(): JsonResponse
    {
        auth()->user()->unreadNotifications->markAsRead();

        \Cache::forget('user:' . auth()->id() . ':unread');

        return response()->json(['success' => true]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markRead(string $id): JsonResponse
    {
        $notification = auth()->user()
            ->unreadNotifications()
            ->where('id', $id)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            \Cache::forget('user:' . auth()->id() . ':unread');
        }

        return response()->json(['success' => true]);
    }
}
