<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Gate for community moderation routes. Admins always pass through — they
 * have the full mod toolkit plus the admin-only extras on top of it.
 */
class EnsureModerator
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user || !$user->canModerate()) {
            abort(403, 'Moderator permission required.');
        }

        return $next($request);
    }
}
