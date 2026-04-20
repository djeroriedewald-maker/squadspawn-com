<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Steam Web API wrapper for player stats.
 *
 * Distinct from the public-store SteamClient used by games:import — this
 * one requires a free personal Steam Web API key and operates on the
 * `/ISteamUser` + `/IPlayerService` endpoints.
 */
class SteamStatsClient
{
    private string $base = 'https://api.steampowered.com';

    public function __construct(private ?string $apiKey = null)
    {
        $this->apiKey ??= config('services.steam_web.key');
    }

    public function hasKey(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Resolve a Steam profile URL or vanity name into a 17-digit SteamID64.
     * Accepts:
     *   - https://steamcommunity.com/id/<vanity>
     *   - https://steamcommunity.com/profiles/<steamid64>
     *   - bare <vanity> or <steamid64>
     */
    public function resolveInput(string $input): ?string
    {
        $input = trim($input);
        if ($input === '') return null;

        // Already a SteamID64?
        if (preg_match('/^7656\d{13}$/', $input)) {
            return $input;
        }

        // Extract from URL
        if (preg_match('#steamcommunity\.com/profiles/(7656\d{13})#i', $input, $m)) {
            return $m[1];
        }
        if (preg_match('#steamcommunity\.com/id/([A-Za-z0-9_-]{2,32})#i', $input, $m)) {
            return $this->resolveVanity($m[1]);
        }
        // Bare vanity
        if (preg_match('/^[A-Za-z0-9_-]{2,32}$/', $input)) {
            return $this->resolveVanity($input);
        }
        return null;
    }

    public function resolveVanity(string $vanity): ?string
    {
        $this->ensureKey();
        $response = Http::timeout(10)->get("{$this->base}/ISteamUser/ResolveVanityURL/v1/", [
            'key' => $this->apiKey,
            'vanityurl' => $vanity,
        ]);
        if (!$response->successful()) return null;
        $data = $response->json('response');
        return ($data['success'] ?? 0) === 1 ? ($data['steamid'] ?? null) : null;
    }

    /**
     * Basic profile: persona name, avatar, community visibility, etc.
     */
    public function playerSummary(string $steamId64): ?array
    {
        $this->ensureKey();
        $response = Http::timeout(10)->get("{$this->base}/ISteamUser/GetPlayerSummaries/v2/", [
            'key' => $this->apiKey,
            'steamids' => $steamId64,
        ]);
        if (!$response->successful()) return null;
        $players = $response->json('response.players') ?? [];
        return $players[0] ?? null;
    }

    /**
     * Owned games with playtime. Returns empty array if the profile is
     * private (Steam returns no games).
     *
     * @return array<int, array{appid:int, name:string, playtime_forever:int, playtime_2weeks?:int, img_icon_url?:string}>
     */
    public function ownedGames(string $steamId64): array
    {
        $this->ensureKey();
        $response = Http::timeout(15)->get("{$this->base}/IPlayerService/GetOwnedGames/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId64,
            'include_appinfo' => 1,
            'include_played_free_games' => 1,
        ]);
        if (!$response->successful()) return [];
        return $response->json('response.games') ?? [];
    }

    /**
     * Recently played games (last 2 weeks).
     */
    public function recentlyPlayed(string $steamId64): array
    {
        $this->ensureKey();
        $response = Http::timeout(10)->get("{$this->base}/IPlayerService/GetRecentlyPlayedGames/v1/", [
            'key' => $this->apiKey,
            'steamid' => $steamId64,
        ]);
        if (!$response->successful()) return [];
        return $response->json('response.games') ?? [];
    }

    private function ensureKey(): void
    {
        if (!$this->apiKey) {
            throw new RuntimeException(
                "Missing STEAM_API_KEY. Get one at https://steamcommunity.com/dev/apikey and add it to .env."
            );
        }
    }
}
