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
            // The User model hides sensitive PII globally; the user themselves
            // needs to see their own email / DOB / referral code in settings,
            // notification prefs on the profile page, etc. Unhide here only
            // for the viewer's OWN record.
            $user->makeVisible([
                'email', 'date_of_birth', 'referral_code',
                'notification_preferences', 'email_verified_at',
                // google_id is needed by the frontend account-delete form
                // to pick the 'type DELETE' path instead of asking OAuth
                // users for a password they never set.
                'google_id',
            ]);

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

            // Impersonation banner info — if the session carries an
            // impersonator_id the current user is logged in as someone
            // else and should see a red "stop impersonating" strip.
            $impersonator = null;
            $impId = $request->session()->get(\App\Http\Controllers\Admin\ImpersonationController::SESSION_KEY);
            if ($impId) {
                $admin = \App\Models\User::find($impId);
                if ($admin) {
                    $impersonator = ['id' => $admin->id, 'name' => $admin->name];
                }
            }

            $authData = [
                'user' => $user,
                'unreadCount' => $unreadCount,
                'achievementCount' => $achievementCount,
                'notifications' => $notifications,
                'canModerate' => $user->canModerate(),
                'isAdmin' => (bool) $user->is_admin,
                'hasChangelogUpdate' => $hasChangelogUpdate,
                'impersonator' => $impersonator,
            ];
        }

        $themePreference = $user?->profile?->theme_preference ?? 'auto';
        if (!in_array($themePreference, ['auto', 'light', 'dark'], true)) {
            $themePreference = 'auto';
        }

        // Active broadcast — the oldest sent-but-undismissed popup for the
        // viewer. Inertia 2 treats top-level closures as lazy props that
        // only evaluate on partial reloads, so we must resolve eagerly
        // here or the popup never ships to the frontend on normal page
        // loads. The underlying query is cheap (index on user_id +
        // dismissed_at).
        $activeBroadcast = $user ? $this->resolveActiveBroadcast($user) : null;

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
            'activeBroadcast' => $activeBroadcast,
            // System-wide feature toggles + admin flash bar. Resolved
            // eagerly — Settings::all() is cached, so the cost is a
            // single in-memory lookup per request.
            'features' => \App\Services\Settings::features(),
            'flashBar' => \App\Services\Settings::flashBar(),
        ];
    }

    /**
     * Find the popup-style broadcast the user hasn't dismissed yet, if any.
     * Banner-style broadcasts surface on /announcements instead.
     */
    private function resolveActiveBroadcast($user): ?array
    {
        // Pop the MOST RECENT undismissed broadcast — freshest news wins.
        // We trust the broadcast_views row to gate delivery: dispatch()
        // and the "Send test to me" flow both create rows explicitly, so
        // filtering on sent_at here would hide draft-test popups for no
        // good reason (the admin expects the test to show up even before
        // a production send).
        $view = \App\Models\BroadcastView::where('user_id', $user->id)
            ->whereNull('dismissed_at')
            ->whereHas('broadcast', function ($q) {
                $q->where('style', 'popup');
            })
            ->with('broadcast')
            ->latest('id')
            ->first();

        if (!$view || !$view->broadcast) return null;

        $b = $view->broadcast;
        return [
            'id' => $b->id,
            'title' => $b->title,
            'body_html' => $b->body_html,
            'cta_label' => $b->cta_label,
            'cta_url' => $b->cta_url,
            'image_url' => $b->image_path ? '/storage/' . $b->image_path : null,
            'youtube_id' => $b->youtubeId(),
            'sent_at_human' => $b->sent_at?->diffForHumans(),
        ];
    }
}
