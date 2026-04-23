<?php

namespace App\Http\Middleware;

use App\Services\Settings;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Gate a route behind a named feature flag. Admins always get through
 * so they can test a disabled feature before flipping it back on.
 *
 * Apply as a route middleware:
 *   ->middleware('feature:lfg')
 */
class CheckFeatureFlag
{
    public function handle(Request $request, Closure $next, string $feature)
    {
        if (Settings::enabled('feature.' . $feature)) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && $user->is_admin) {
            return $next($request);
        }

        $response = Inertia::render('FeatureDisabled', [
            'feature' => $feature,
        ])->toResponse($request)->setStatusCode(503);

        return $response;
    }
}
