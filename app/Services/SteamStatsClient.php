<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
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

    /**
     * Build the profile-stats payload shown in the UI (persona, top games,
     * recent activity). Returns null if the API key isn't configured or the
     * profile is unreachable. Does not cache — use {@see cachedStats()}.
     */
    public function buildStats(string $steamId64): ?array
    {
        if (!$this->hasKey()) return null;

        try {
            $summary = $this->playerSummary($steamId64);
            $owned = $this->ownedGames($steamId64);
            $recent = $this->recentlyPlayed($steamId64);
        } catch (\Throwable) {
            return null;
        }

        if (!$summary) return null;

        usort($owned, fn ($a, $b) => ($b['playtime_forever'] ?? 0) <=> ($a['playtime_forever'] ?? 0));
        $topGames = [];
        foreach (array_slice($owned, 0, 5) as $g) {
            if (empty($g['playtime_forever']) || $g['playtime_forever'] < 60) continue;
            $topGames[] = [
                'appid' => $g['appid'] ?? null,
                'name' => $g['name'] ?? 'Unknown',
                'hours' => round(($g['playtime_forever'] ?? 0) / 60),
                'icon' => !empty($g['img_icon_url']) && !empty($g['appid'])
                    ? "https://media.steampowered.com/steamcommunity/public/images/apps/{$g['appid']}/{$g['img_icon_url']}.jpg"
                    : null,
            ];
        }

        $totalHours = array_sum(array_column($owned, 'playtime_forever')) / 60;

        $recentClean = [];
        foreach (array_slice($recent, 0, 3) as $g) {
            $recentClean[] = [
                'name' => $g['name'] ?? 'Unknown',
                'hoursTwoWeeks' => round(($g['playtime_2weeks'] ?? 0) / 60, 1),
            ];
        }

        return [
            'personaName' => $summary['personaname'] ?? null,
            'avatar' => $summary['avatarmedium'] ?? null,
            'profileUrl' => $summary['profileurl'] ?? null,
            'visibility' => $summary['communityvisibilitystate'] ?? null,
            'ownedCount' => count($owned),
            'totalHours' => (int) round($totalHours),
            'topGames' => $topGames,
            'recent' => $recentClean,
        ];
    }

    /**
     * Cached variant of {@see buildStats()} — 1h TTL per SteamID to keep
     * us well under the Steam Web API rate limits.
     */
    public function cachedStats(string $steamId64): ?array
    {
        return Cache::remember(
            $this->cacheKey($steamId64),
            3600,
            fn () => $this->buildStats($steamId64),
        );
    }

    /**
     * Forget the cached stats for a SteamID — used by the manual refresh.
     */
    public function clearStatsCache(string $steamId64): void
    {
        Cache::forget($this->cacheKey($steamId64));
    }

    private function cacheKey(string $steamId64): string
    {
        return "steam:stats:{$steamId64}";
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
