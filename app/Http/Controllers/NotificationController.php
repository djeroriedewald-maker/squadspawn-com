<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    public function count(): JsonResponse
    {
        $user = auth()->user();

        return response()->json([
            'unreadCount' => $user->unreadNotifications()->count(),
        ]);
    }

    public function markAllRead(): JsonResponse
    {
        auth()->user()->unreadNotifications->markAsRead();

        return response()->json(['success' => true]);
    }
}
