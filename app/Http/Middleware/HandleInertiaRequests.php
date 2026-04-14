<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $authData = ['user' => null, 'unreadCount' => 0, 'notifications' => [], 'achievementCount' => 0];

        if ($user) {
            $user->load(['profile', 'games']);

            // Cache notification count for 60 seconds to reduce queries
            $unreadCount = Cache::remember("user:{$user->id}:unread", 60, function () use ($user) {
                return $user->unreadNotifications()->count();
            });

            $achievementCount = Cache::remember("user:{$user->id}:achievements", 300, function () use ($user) {
                return $user->achievements()->count();
            });

            // Only load notifications if there are unread ones
            $notifications = [];
            if ($unreadCount > 0) {
                $notifications = $user->unreadNotifications()->take(10)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'data' => $n->data,
                    'created_at' => $n->created_at->diffForHumans(),
                ]);
            }

            $authData = [
                'user' => $user,
                'unreadCount' => $unreadCount,
                'achievementCount' => $achievementCount,
                'notifications' => $notifications,
            ];
        }

        return [
            ...parent::share($request),
            'auth' => $authData,
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
            ],
        ];
    }
}
