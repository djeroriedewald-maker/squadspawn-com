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

    /**
     * Fetch one raw page of the /games endpoint. Callers handle pagination
     * themselves (used by the "add N new games" incremental importer that
     * needs to peek at list results before deciding whether to spend a
     * detail call on each row).
     *
     * @param  array<string, mixed>  $filters  e.g. ['ordering' => '-added', 'page_size' => 40, 'page' => 3]
     * @return array<string, mixed>
     */
    public function listGames(array $filters): array
    {
        return $this->get('/games', $filters)->json() ?? [];
    }

    private function get(string $path, array $query = []): Response
    {
        $this->ensureKey();

        $attempts = 0;
        $maxAttempts = 3;
        $lastError = null;

        while ($attempts < $maxAttempts) {
            $attempts++;
            try {
                $response = Http::acceptJson()
                    ->timeout(20)
                    ->get($this->baseUrl . $path, array_merge(['key' => $this->apiKey], $query));

                // 4xx (except 429): permanent — don't retry
                if ($response->status() >= 400 && $response->status() < 500 && $response->status() !== 429) {
                    throw new RuntimeException(
                        "RAWG API error ({$response->status()}) for {$path}: " . $response->body()
                    );
                }

                if ($response->successful()) {
                    return $response;
                }

                // 5xx or 429 → retry with short backoff
                $lastError = "status {$response->status()}";
            } catch (\Illuminate\Http\Client\ConnectionException $e) {
                $lastError = $e->getMessage();
            }

            if ($attempts < $maxAttempts) {
                usleep(500_000 * $attempts); // 0.5s, 1s backoff
            }
        }

        throw new RuntimeException("RAWG API failed after {$maxAttempts} attempts for {$path}: {$lastError}");
    }
}
