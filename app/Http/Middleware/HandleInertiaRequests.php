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

        $authData = ['user' => null, 'unreadCount' => 0, 'notifications' => [], 'achievementCount' => 0, 'canModerate' => false, 'isAdmin' => false];

        if ($user) {
            $user->load('profile');

            // Games are rendered in the nav + several pages but rarely
            // change. Cache the list per-user; GamesController::quickAdd/
            // quickRemove invalidates. Dramatically cheaper than loading
            // the pivot + games row on every authenticated request.
            // Wrapped in try so a cache-deserialisation hiccup can never
            // take down an authenticated page load.
            try {
                $user->setRelation('games', Cache::remember(
                    "user:{$user->id}:games",
                    300,
                    fn () => $user->games()->get()
                ));
            } catch (\Throwable $e) {
                \Log::warning('games cache fell back to live load: ' . $e->getMessage());
                Cache::forget("user:{$user->id}:games");
                $user->load('games');
            }

            // Cache notification count for 10 seconds (polling refreshes this)
            $unreadCount = Cache::remember("user:{$user->id}:unread", 10, function () use ($user) {
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
                'canModerate' => $user->canModerate(),
                'isAdmin' => (bool) $user->is_admin,
            ];
        }

        $themePreference = $user?->profile?->theme_preference ?? 'auto';
        if (!in_array($themePreference, ['auto', 'light', 'dark'], true)) {
            $themePreference = 'auto';
        }

        return [
            ...parent::share($request),
            'auth' => $authData,
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
            ],
            'theme' => [
                'preference' => $themePreference,
                'authed' => $user !== null,
            ],
        ];
    }
}
