<?php

namespace App\Http\Middleware;

use App\Services\AchievementService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TrackLastActivity
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->updated_at->lt(now()->subMinutes(5))) {
            $user->touch();

            // Daily login XP (once per day)
            $dailyKey = "xp_daily:{$user->id}:" . today()->toDateString();
            if (!Cache::has($dailyKey)) {
                Cache::put($dailyKey, true, 86400);
                try {
                    AchievementService::awardXp($user, 'daily_login');
                } catch (\Throwable) {}
            }
        }

        return $next($request);
    }
}
