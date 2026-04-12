<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureProfileComplete
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && !$user->profile) {
            $allowed = [
                'game-profile.edit', 'game-profile.update', 'game-profile.show',
                'avatar.upload', 'avatar.preset',
                'logout', 'profile.edit', 'profile.update', 'profile.destroy',
            ];

            if (!in_array($request->route()?->getName(), $allowed)) {
                return redirect()->route('game-profile.edit')
                    ->with('message', 'Please set up your gaming profile first!');
            }
        }

        return $next($request);
    }
}
