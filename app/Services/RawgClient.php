<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Thin wrapper around the RAWG Video Games Database API.
 *
 * Docs: https://api.rawg.io/docs/
 * Get a free key: https://rawg.io/apidocs
 */
class RawgClient
{
    public function __construct(
        private ?string $apiKey = null,
        private string $baseUrl = 'https://api.rawg.io/api',
    ) {
        $this->apiKey ??= config('services.rawg.key');
        $this->baseUrl = config('services.rawg.base', $this->baseUrl);
    }

    private function ensureKey(): void
    {
        if (!$this->apiKey) {
            throw new RuntimeException(
                "Missing RAWG_API_KEY. Get a free key at https://rawg.io/apidocs and add it to .env."
            );
        }
    }

    /**
     * Search for games by query string. Returns the raw `results` array.
     *
     * @return array<int, array<string, mixed>>
     */
    public function search(string $query, int $pageSize = 10): array
    {
        return $this->get('/games', [
            'search' => $query,
            'page_size' => $pageSize,
        ])->json('results') ?? [];
    }

    /**
     * Top games ordered by RAWG rating count (popularity proxy).
     *
     * @return array<int, array<string, mixed>>
     */
    public function top(int $pageSize = 40): array
    {
        return $this->get('/games', [
            'ordering' => '-added',
            'page_size' => $pageSize,
        ])->json('results') ?? [];
    }

    /**
     * Fetch the full detail record for a single game (by slug or id).
     * Detail endpoint includes `description_raw` which the list endpoint omits.
     *
     * @return array<string, mixed>
     */
    public function detail(string $slugOrId): array
    {
        return $this->get("/games/{$slugOrId}")->json() ?? [];
    }

    private function get(string $path, array $query = []): Response
    {
        $this->ensureKey();

        $response = Http::acceptJson()
            ->timeout(20)
            ->get($this->baseUrl . $path, array_merge(['key' => $this->apiKey], $query));

        if (!$response->successful()) {
            throw new RuntimeException(
                "RAWG API error ({$response->status()}) for {$path}: " . $response->body()
            );
        }

        return $response;
    }
}
