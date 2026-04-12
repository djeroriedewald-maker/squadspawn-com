<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class TrackLastActivity
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Update updated_at every 5 minutes to avoid excessive DB writes
        if ($user && $user->updated_at->lt(now()->subMinutes(5))) {
            $user->touch();
        }

        return $next($request);
    }
}
