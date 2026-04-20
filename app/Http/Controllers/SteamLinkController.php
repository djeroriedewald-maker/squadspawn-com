<?php

namespace App\Http\Controllers;

use App\Services\SteamStatsClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SteamLinkController extends Controller
{
    /**
     * Current link status for the logged-in user.
     */
    public function show(SteamStatsClient $steam): JsonResponse
    {
        $profile = auth()->user()->profile;
        if (!$profile) {
            return response()->json(['linked' => false, 'available' => $steam->hasKey()]);
        }

        $linked = !blank($profile->steam_id);
        $summary = null;
        if ($linked && $steam->hasKey()) {
            $summary = $steam->playerSummary($profile->steam_id);
        }

        return response()->json([
            'available' => $steam->hasKey(),
            'linked' => $linked,
            'steamId' => $linked ? $profile->steam_id : null,
            'personaName' => $summary['personaname'] ?? null,
            'avatar' => $summary['avatarmedium'] ?? null,
            'profileUrl' => $summary['profileurl'] ?? null,
            'visibility' => $summary['communityvisibilitystate'] ?? null,
        ]);
    }

    /**
     * Link a Steam profile. Accepts a profile URL, vanity name, or SteamID64.
     */
    public function store(Request $request, SteamStatsClient $steam): JsonResponse
    {
        if (!$steam->hasKey()) {
            return response()->json(['error' => 'Steam integration is not configured on this server.'], 503);
        }

        $data = $request->validate([
            'input' => ['required', 'string', 'max:255'],
        ]);

        $steamId = $steam->resolveInput($data['input']);
        if (!$steamId) {
            return response()->json(['error' => "Couldn't resolve that Steam profile. Paste the full URL or a SteamID64."], 422);
        }

        $summary = $steam->playerSummary($steamId);
        if (!$summary) {
            return response()->json(['error' => "Steam doesn't know that profile."], 422);
        }

        $profile = auth()->user()->profile;
        if (!$profile) {
            return response()->json(['error' => 'Set up your game profile first.'], 422);
        }

        $profile->steam_id = $steamId;
        $profile->steam_synced_at = now();
        $profile->save();

        return response()->json([
            'linked' => true,
            'steamId' => $steamId,
            'personaName' => $summary['personaname'] ?? null,
            'avatar' => $summary['avatarmedium'] ?? null,
            'profileUrl' => $summary['profileurl'] ?? null,
            'visibility' => $summary['communityvisibilitystate'] ?? null,
        ]);
    }

    /**
     * Force a cache refresh of the logged-in user's Steam stats and return
     * the fresh payload. Throttled so it can't be used to hammer Steam.
     */
    public function refresh(SteamStatsClient $steam): JsonResponse
    {
        $profile = auth()->user()->profile;
        if (!$profile || !$profile->steam_id) {
            return response()->json(['error' => 'No Steam account linked.'], 422);
        }

        $steam->clearStatsCache($profile->steam_id);
        $stats = $steam->cachedStats($profile->steam_id);

        return response()->json(['steamStats' => $stats]);
    }

    /**
     * Unlink.
     */
    public function destroy(): JsonResponse
    {
        $profile = auth()->user()->profile;
        if ($profile) {
            $profile->steam_id = null;
            $profile->steam_synced_at = null;
            $profile->save();
        }
        return response()->json(['linked' => false]);
    }
}
