<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin client for the Plausible Stats API.
 *
 * Needs two env vars:
 *   PLAUSIBLE_API_KEY     — generated under Account → API Keys on plausible.io
 *   VITE_PLAUSIBLE_DOMAIN — the site id (e.g. "squadspawn.com"), same var the
 *                           frontend tracking script uses
 *
 * Every call times out fast (3s) and returns null on failure so a flaky
 * Plausible response doesn't block the admin analytics page.
 */
class PlausibleClient
{
    private const BASE = 'https://plausible.io/api/v1';
    private const TIMEOUT = 3;

    private ?string $apiKey;
    private string $domain;

    public function __construct()
    {
        $this->apiKey = (string) env('PLAUSIBLE_API_KEY') ?: null;
        $this->domain = (string) env('VITE_PLAUSIBLE_DOMAIN', 'squadspawn.com');
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Aggregate metrics (visitors, pageviews, bounce_rate, visit_duration)
     * for a Plausible time window. Accepts day / 7d / 30d / 6mo / 12mo.
     * Returns the keyed 'value' numbers or null when anything goes wrong.
     *
     * @return array{visitors:int,pageviews:int,bounce_rate:float|int,visit_duration:float|int}|null
     */
    public function aggregate(string $period = '30d'): ?array
    {
        if (!$this->isConfigured()) return null;

        try {
            $r = Http::withToken($this->apiKey)
                ->timeout(self::TIMEOUT)
                ->get(self::BASE . '/stats/aggregate', [
                    'site_id' => $this->domain,
                    'period' => $period,
                    'metrics' => 'visitors,pageviews,bounce_rate,visit_duration',
                ]);
            if (!$r->successful()) {
                return null;
            }
            $results = $r->json('results') ?? [];
            return [
                'visitors' => (int) ($results['visitors']['value'] ?? 0),
                'pageviews' => (int) ($results['pageviews']['value'] ?? 0),
                'bounce_rate' => $results['bounce_rate']['value'] ?? 0,
                'visit_duration' => $results['visit_duration']['value'] ?? 0,
            ];
        } catch (\Throwable $e) {
            Log::warning('Plausible aggregate call failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Top N breakdown for a given property (e.g. visit:source, visit:country,
     * event:page). Returns [[name => x, visitors => 123], …] or null on error.
     *
     * @return array<int, array{name:string, visitors:int}>|null
     */
    public function topBreakdown(string $property, string $period = '30d', int $limit = 8): ?array
    {
        if (!$this->isConfigured()) return null;

        try {
            $r = Http::withToken($this->apiKey)
                ->timeout(self::TIMEOUT)
                ->get(self::BASE . '/stats/breakdown', [
                    'site_id' => $this->domain,
                    'period' => $period,
                    'property' => $property,
                    'limit' => $limit,
                ]);
            if (!$r->successful()) {
                return null;
            }
            $results = $r->json('results') ?? [];
            return array_map(fn ($row) => [
                'name' => (string) ($row[explode(':', $property, 2)[1] ?? 'name'] ?? 'Unknown'),
                'visitors' => (int) ($row['visitors'] ?? 0),
            ], $results);
        } catch (\Throwable $e) {
            Log::warning('Plausible breakdown call failed', ['error' => $e->getMessage(), 'property' => $property]);
            return null;
        }
    }
}
