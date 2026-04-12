<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
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

        $authData = ['user' => null, 'unreadCount' => 0, 'notifications' => []];

        if ($user) {
            $user->load(['profile', 'games']);

            $authData = [
                'user' => $user,
                'unreadCount' => $user->unreadNotifications()->count(),
                'notifications' => $user->unreadNotifications()->take(10)->get()->map(fn ($n) => [
                    'id' => $n->id,
                    'data' => $n->data,
                    'created_at' => $n->created_at->diffForHumans(),
                ]),
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
