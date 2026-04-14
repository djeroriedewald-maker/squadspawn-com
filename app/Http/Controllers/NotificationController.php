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

        $notifications = $user->unreadNotifications()
            ->take(15)
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'data' => $n->data,
                'created_at' => $n->created_at->diffForHumans(),
            ]);

        return response()->json([
            'unreadCount' => $user->unreadNotifications()->count(),
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
