<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin wrapper around the public Steam Store endpoints.
 *
 * No API key required for the endpoints used here. Rate limits are
 * loose but real — keep parallelism low in loops.
 *
 * Useful endpoints:
 *   /api/appdetails?appids=X         → rich game metadata
 *   /api/featuredcategories          → top sellers / new releases
 *   /api/getappdetails?appids=X,Y    → same, multi-get (same shape)
 */
class SteamClient
{
    private string $storeBase = 'https://store.steampowered.com';
    private string $cdnBase = 'https://steamcdn-a.akamaihd.net/steam/apps';

    /**
     * Fetch full details for a Steam AppID.
     * Returns the "data" payload or throws if the app is unknown.
     *
     * @return array<string, mixed>
     */
    public function detail(int $appId, string $lang = 'english'): array
    {
        $response = Http::acceptJson()
            ->timeout(20)
            ->get("{$this->storeBase}/api/appdetails", [
                'appids' => $appId,
                'l' => $lang,
                'cc' => 'us',
            ]);

        if (!$response->successful()) {
            throw new RuntimeException("Steam API error ({$response->status()}) for appid {$appId}");
        }

        $payload = $response->json();
        $entry = $payload[$appId] ?? null;
        if (!$entry || empty($entry['success']) || !isset($entry['data'])) {
            throw new RuntimeException("Steam returned no data for appid {$appId} (not a public game?)");
        }

        return $entry['data'];
    }

    /**
     * Top sellers (no key). Returns an array of {appid, name} entries.
     *
     * @return array<int, array{appid:int, name:string}>
     */
    public function topSellers(int $cap = 40): array
    {
        $response = Http::acceptJson()
            ->timeout(20)
            ->get("{$this->storeBase}/api/featuredcategories", [
                'cc' => 'us',
                'l' => 'english',
            ]);

        if (!$response->successful()) {
            throw new RuntimeException("Steam featuredcategories error ({$response->status()})");
        }

        $items = $response->json('top_sellers.items') ?? [];
        return array_slice(
            array_map(fn ($item) => ['appid' => (int) $item['id'], 'name' => (string) $item['name']], $items),
            0,
            $cap,
        );
    }

    /**
     * Predictable cover URL — the portrait "library" image is the closest
     * match to a store-page box art. Falls back to header if missing.
     */
    public function coverUrl(int $appId): string
    {
        return "{$this->cdnBase}/{$appId}/library_600x900.jpg";
    }

    public function headerUrl(int $appId): string
    {
        return "{$this->cdnBase}/{$appId}/header.jpg";
    }
}
