<?php

namespace App\Http\Middleware;

use App\Services\Settings;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * DB-backed maintenance mode. When `maintenance.enabled` is true,
 * every non-admin gets the maintenance page. Admins stay logged-in
 * and can keep working (including reaching /admin to toggle it off).
 */
class CheckMaintenanceMode
{
    public function handle(Request $request, Closure $next)
    {
        $maint = Settings::maintenance();
        if (!$maint['enabled']) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && $user->is_admin) {
            return $next($request);
        }

        // Let login/logout keep functioning so an admin can sign in
        // during an outage. All /admin/* requests stay reachable too.
        $path = $request->path();
        $bypassPrefixes = ['login', 'logout', 'admin', 'health', 'up', 'auth/google'];
        foreach ($bypassPrefixes as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix . '/')) {
                return $next($request);
            }
        }

        $response = Inertia::render('Maintenance', [
            'message' => $maint['message'],
            'eta_at' => $maint['eta_at'],
        ])->toResponse($request)->setStatusCode(503);

        return $response;
    }
}
