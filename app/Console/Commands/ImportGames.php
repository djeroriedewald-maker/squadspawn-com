<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\RawgClient;
use App\Services\SteamClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class ImportGames extends Command
{
    protected $signature = 'games:import
        {--source=rawg : Data source: rawg or steam}
        {--query= : Search term (RAWG only)}
        {--slug= : RAWG slug or id}
        {--appid= : Steam AppID}
        {--top= : Import top N games from the chosen source}
        {--preset : Import everything from resources/seeds/games.json}
        {--preset-file= : Override the preset file path}
        {--only= : Restrict preset import to one source (steam or rawg)}
        {--no-images : Store remote cover URLs instead of downloading locally}
        {--force : Overwrite existing fields (default fills only blanks)}';

    protected $description = 'Import games from RAWG or Steam (covers, descriptions, release dates)';

    public function handle(RawgClient $rawg, SteamClient $steam): int
    {
        if ($this->option('preset') || $this->option('preset-file')) {
            return $this->importFromPreset($rawg, $steam);
        }

        $source = strtolower($this->option('source'));
        $hasFilter = $this->option('query') || $this->option('slug') || $this->option('appid') || $this->option('top');

        if (!$hasFilter) {
            $this->error('Pick one of --query, --slug, --appid, --top, or --preset.');
            $this->line('');
            $this->line('Examples:');
            $this->line('  php artisan games:import --preset');
            $this->line('  php artisan games:import --top=40                   # top RAWG games');
            $this->line('  php artisan games:import --source=steam --top=20    # top Steam sellers');
            $this->line('  php artisan games:import --source=steam --appid=730 # CS2');
            $this->line('  php artisan games:import --query="Baldurs Gate 3"   # RAWG search');
            return self::INVALID;
        }

        try {
            if ($source === 'steam') {
                return $this->importFromSteam($steam) ? self::SUCCESS : self::FAILURE;
            }
            return $this->importFromRawg($rawg) ? self::SUCCESS : self::FAILURE;
        } catch (Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }
    }

    // --- RAWG path -----------------------------------------------------------

    private function importFromRawg(RawgClient $rawg): bool
    {
        $slug = $this->option('slug');
        $query = $this->option('query');
        $top = $this->option('top');

        $candidates = [];
        if ($slug) {
            $candidates = [$rawg->detail($slug)];
        } elseif ($query) {
            $hits = $rawg->search($query, 1);
            if (!$hits) {
                $this->warn("No RAWG results for \"{$query}\".");
                return true;
            }
            $candidates = [$rawg->detail($hits[0]['slug'])];
        } elseif ($top) {
            $this->info("Fetching top {$top} games from RAWG…");
            foreach ($rawg->top((int) $top) as $hit) {
                try {
                    $candidates[] = $rawg->detail($hit['slug']);
                } catch (Throwable $e) {
                    $this->warn("  detail failed for {$hit['slug']}: {$e->getMessage()}");
                }
            }
        }

        $this->upsertMany($candidates, fn ($d) => $this->normalizeRawg($d));
        return true;
    }

    // --- Steam path ----------------------------------------------------------

    private function importFromSteam(SteamClient $steam): bool
    {
        $appId = $this->option('appid');
        $top = $this->option('top');

        $candidates = [];
        if ($appId) {
            $candidates = [['__steam_appid' => (int) $appId]];
        } elseif ($top) {
            $this->info("Fetching top {$top} Steam sellers…");
            foreach ($steam->topSellers((int) $top) as $hit) {
                $candidates[] = ['__steam_appid' => $hit['appid']];
            }
        }

        $payloads = [];
        foreach ($candidates as $c) {
            try {
                $data = $steam->detail($c['__steam_appid']);
                $data['__steam_appid'] = $c['__steam_appid'];
                $payloads[] = $data;
            } catch (Throwable $e) {
                $this->warn("  steam detail failed for {$c['__steam_appid']}: {$e->getMessage()}");
            }
        }

        $this->upsertMany($payloads, fn ($d) => $this->normalizeSteam($d, $steam));
        return true;
    }

    // --- Preset path ---------------------------------------------------------

    private function importFromPreset(RawgClient $rawg, SteamClient $steam): int
    {
        $path = $this->option('preset-file') ?: base_path('resources/seeds/games.json');
        if (!is_file($path)) {
            $this->error("Preset file not found: {$path}");
            return self::FAILURE;
        }
        $rows = json_decode(file_get_contents($path), true);
        if (!is_array($rows)) {
            $this->error("Preset file is not valid JSON: {$path}");
            return self::FAILURE;
        }

        $only = $this->option('only') ? strtolower($this->option('only')) : null;
        if ($only) {
            $before = count($rows);
            $rows = array_values(array_filter(
                $rows,
                fn ($row) => strtolower($row['source'] ?? 'rawg') === $only,
            ));
            $this->info("Filtering to source={$only}: " . count($rows) . "/{$before} rows");
        }

        $this->info("Importing " . count($rows) . " games from preset…");

        $payloads = [];
        foreach ($rows as $row) {
            $src = strtolower($row['source'] ?? 'rawg');
            try {
                if ($src === 'steam' && !empty($row['appid'])) {
                    $data = $steam->detail((int) $row['appid']);
                    $data['__steam_appid'] = (int) $row['appid'];
                    $data['__forced_slug'] = $row['slug'] ?? null;
                    $payloads[] = [$src, $data];
                } elseif ($src === 'rawg' && !empty($row['slug'])) {
                    $data = $rawg->detail($row['slug']);
                    $data['__forced_slug'] = $row['slug'];
                    $payloads[] = [$src, $data];
                } else {
                    $this->warn("  skipping invalid row: " . json_encode($row));
                }
            } catch (Throwable $e) {
                $this->warn("  fetch failed ({$src}): {$e->getMessage()}");
            }
        }

        // Mixed-source normalization
        $normalized = array_map(
            fn ($entry) => $entry[0] === 'steam'
                ? $this->normalizeSteam($entry[1], $steam)
                : $this->normalizeRawg($entry[1]),
            $payloads,
        );

        $this->upsertMany(
            $normalized,
            fn ($attrs) => $attrs, // already normalized
        );

        return self::SUCCESS;
    }

    // --- Normalization -------------------------------------------------------

    private function normalizeRawg(array $data): ?array
    {
        if (empty($data['slug']) || empty($data['name'])) return null;

        return [
            'name' => $data['name'],
            'slug' => $data['__forced_slug'] ?? $data['slug'],
            'rawg_id' => $data['id'] ?? null,
            'description' => isset($data['description_raw'])
                ? Str::limit(trim($data['description_raw']), 400, '…')
                : null,
            'released_at' => $data['released'] ?? null,
            'cover_image' => $this->resolveCover(
                $data['background_image'] ?? null,
                $data['__forced_slug'] ?? $data['slug'],
            ),
            'genre' => $data['genres'][0]['name'] ?? null,
            'platforms' => $this->rawgPlatformSlugs($data),
        ];
    }

    private function normalizeSteam(array $data, SteamClient $steam): ?array
    {
        $appId = $data['__steam_appid'] ?? ($data['steam_appid'] ?? null);
        if (!$appId || empty($data['name'])) return null;

        $slug = $data['__forced_slug'] ?? Str::slug($data['name']);

        $description = $data['short_description'] ?? null;
        if ($description) {
            $description = Str::limit(trim(strip_tags($description)), 400, '…');
        }

        return [
            'name' => $data['name'],
            'slug' => $slug,
            'rawg_id' => null,
            'description' => $description,
            'released_at' => $this->parseSteamDate($data['release_date']['date'] ?? null),
            'cover_image' => $this->resolveCover($steam->coverUrl($appId), $slug)
                ?? $this->resolveCover($steam->headerUrl($appId), $slug),
            'genre' => $data['genres'][0]['description'] ?? null,
            'platforms' => $this->steamPlatformSlugs($data),
        ];
    }

    private function rawgPlatformSlugs(array $data): array
    {
        $slugs = [];
        foreach (($data['parent_platforms'] ?? []) as $wrap) {
            if (isset($wrap['platform']['slug'])) {
                $slugs[] = $wrap['platform']['slug'];
            }
        }
        return array_values(array_unique($slugs));
    }

    private function steamPlatformSlugs(array $data): array
    {
        $slugs = [];
        $flags = $data['platforms'] ?? [];
        if (!empty($flags['windows'])) $slugs[] = 'pc';
        if (!empty($flags['mac'])) $slugs[] = 'mac';
        if (!empty($flags['linux'])) $slugs[] = 'linux';

        // Cross-platform hint: Steam lists PS/Xbox/Switch support via categories
        foreach (($data['categories'] ?? []) as $cat) {
            $desc = strtolower($cat['description'] ?? '');
            if (str_contains($desc, 'playstation')) $slugs[] = 'playstation';
            elseif (str_contains($desc, 'xbox')) $slugs[] = 'xbox';
            elseif (str_contains($desc, 'nintendo')) $slugs[] = 'nintendo';
        }
        return array_values(array_unique($slugs));
    }

    private function parseSteamDate(?string $raw): ?string
    {
        if (!$raw) return null;
        try {
            return \Carbon\Carbon::parse($raw)->toDateString();
        } catch (Throwable) {
            return null;
        }
    }

    // --- Persistence + images ------------------------------------------------

    private function upsertMany(array $items, callable $normalize): void
    {
        $imported = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($items as $raw) {
            $attrs = is_array($raw) && isset($raw['name']) ? $raw : $normalize($raw);
            if (!$attrs) { $skipped++; continue; }

            $existing = Game::where('slug', $attrs['slug'])
                ->orWhere(function ($q) use ($attrs) {
                    if (!empty($attrs['rawg_id'])) {
                        $q->where('rawg_id', $attrs['rawg_id']);
                    }
                })
                ->first();

            if ($existing) {
                if ($this->option('force')) {
                    $existing->fill($attrs);
                } else {
                    foreach ($attrs as $key => $value) {
                        if (blank($existing->{$key}) && filled($value)) {
                            $existing->{$key} = $value;
                        }
                    }
                }
                if ($existing->isDirty()) {
                    $existing->save();
                    $updated++;
                    $this->line("  updated  {$attrs['name']}");
                } else {
                    $skipped++;
                    $this->line("  kept     {$attrs['name']}");
                }
            } else {
                Game::create($attrs);
                $imported++;
                $this->info("  added    {$attrs['name']}");
            }
        }

        $this->line('');
        $this->info("Done — added: {$imported}, updated: {$updated}, skipped: {$skipped}");
    }

    /**
     * Download cover to public/images/games/{slug}.jpg, or return remote URL
     * if --no-images or download fails.
     */
    private function resolveCover(?string $remote, string $slug): ?string
    {
        if (!$remote) return null;
        if ($this->option('no-images')) return $remote;

        try {
            $response = Http::timeout(30)->get($remote);
            if (!$response->successful() || !$response->body()) {
                return $remote;
            }
            $path = public_path("images/games/{$slug}.jpg");
            if (!is_dir(dirname($path))) {
                mkdir(dirname($path), 0755, true);
            }
            file_put_contents($path, $response->body());
            return "/images/games/{$slug}.jpg";
        } catch (Throwable $e) {
            $this->warn("  image download failed for {$slug}: {$e->getMessage()}");
            return $remote;
        }
    }
}
