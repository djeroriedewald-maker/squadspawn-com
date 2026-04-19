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
     * Top games ordered by RAWG popularity. Paginates internally — RAWG
     * caps page_size at 40, so we iterate until we have `$count` rows
     * (or the API runs out).
     *
     * @return array<int, array<string, mixed>>
     */
    public function top(int $count = 40, string $ordering = '-added'): array
    {
        $results = [];
        $page = 1;
        while (count($results) < $count) {
            $pageSize = min(40, $count - count($results));
            $data = $this->get('/games', [
                'ordering' => $ordering,
                'page_size' => $pageSize,
                'page' => $page,
            ])->json();
            $batch = $data['results'] ?? [];
            if (!$batch) break;
            $results = array_merge($results, $batch);
            if (empty($data['next'])) break;
            $page++;
        }
        return array_slice($results, 0, $count);
    }

    /**
     * Games filtered by genre slug (action, shooter, strategy, rpg, etc).
     *
     * @return array<int, array<string, mixed>>
     */
    public function byGenre(string $genre, int $count = 40, string $ordering = '-added'): array
    {
        $results = [];
        $page = 1;
        while (count($results) < $count) {
            $pageSize = min(40, $count - count($results));
            $data = $this->get('/games', [
                'genres' => $genre,
                'ordering' => $ordering,
                'page_size' => $pageSize,
                'page' => $page,
            ])->json();
            $batch = $data['results'] ?? [];
            if (!$batch) break;
            $results = array_merge($results, $batch);
            if (empty($data['next'])) break;
            $page++;
        }
        return array_slice($results, 0, $count);
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
