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

        $authData = ['user' => null, 'unreadCount' => 0, 'notifications' => [], 'achievementCount' => 0, 'canModerate' => false, 'isAdmin' => false, 'hasChangelogUpdate' => false];

        // Cached globally — every authenticated visitor checks this, so
        // hitting the DB each time is wasteful. Invalidated on create/
        // update/delete in Admin\ChangelogController via a helper below.
        $latestChangelogAt = \Illuminate\Support\Facades\Cache::remember(
            'changelog:latest_published_at',
            600,
            fn () => \App\Models\ChangelogEntry::published()
                ->orderByDesc('published_at')
                ->value('published_at'),
        );

        if ($user) {
            $user->load(['profile', 'games']);

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

            // Dot on the nav until the user hits /changelog. Uses the
            // profile timestamp so it survives across devices.
            $lastSeen = $user->profile?->changelog_last_seen_at;
            $hasChangelogUpdate = $latestChangelogAt
                && ($lastSeen === null || $latestChangelogAt > $lastSeen);

            $authData = [
                'user' => $user,
                'unreadCount' => $unreadCount,
                'achievementCount' => $achievementCount,
                'notifications' => $notifications,
                'canModerate' => $user->canModerate(),
                'isAdmin' => (bool) $user->is_admin,
                'hasChangelogUpdate' => $hasChangelogUpdate,
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
