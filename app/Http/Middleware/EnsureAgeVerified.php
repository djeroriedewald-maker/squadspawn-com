<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAgeVerified
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && !$user->date_of_birth) {
            // Routes that must stay reachable while age is unverified:
            // the verification form itself, logout, profile edit (so
            // they can delete the account), and a handful of essential
            // housekeeping endpoints that the layout always fires.
            $allowed = [
                'age-verification', 'age-verification.store',
                'logout', 'profile.edit', 'profile.update', 'profile.destroy',
                'impersonate.stop',
                'notifications.poll', 'notifications.readAll', 'notifications.markRead',
                'announcements.index', 'announcements.viewed', 'announcements.dismiss',
                'push.config', 'push.subscribe', 'push.unsubscribe',
            ];

            if (!in_array($request->route()?->getName(), $allowed)) {
                // Non-GET requests can't be redirected meaningfully — reject
                // them hard so scripts can't bypass the gate by just hitting
                // an API endpoint directly.
                if (!$request->isMethod('GET')) {
                    abort(403, 'Age verification required.');
                }
                return redirect()->route('age-verification');
            }
        }

        return $next($request);
    }
}
