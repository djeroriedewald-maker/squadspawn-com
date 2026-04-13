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
            $allowed = [
                'age-verification', 'age-verification.store',
                'logout', 'profile.edit', 'profile.update', 'profile.destroy',
            ];

            if (!in_array($request->route()?->getName(), $allowed)) {
                return redirect()->route('age-verification');
            }
        }

        return $next($request);
    }
}
