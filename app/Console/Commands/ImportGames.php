<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Models\GameImport;
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
        {--genre= : RAWG genre slug to filter top by (action, shooter, rpg, strategy, etc)}
        {--ordering=-added : RAWG ordering: -added (popularity), -rating, -released, -metacritic}
        {--preset : Import everything from resources/seeds/games.json}
        {--preset-file= : Override the preset file path}
        {--only= : Restrict preset import to one source (steam or rawg)}
        {--local-images : Download covers to public/images/games/ instead of keeping CDN URLs (default is CDN)}
        {--no-images : Deprecated alias — CDN URLs are now the default. Kept for backwards compat.}
        {--skip-existing : Skip detail API calls for games whose slug already exists (saves RAWG quota on incremental top-ups)}
        {--new= : Keep paginating RAWG until N net-new games have been added (dupes are skipped cheaply via bulk slug lookup)}
        {--max-calls= : Safety cap on total RAWG API calls when using --new (default: --new * 2 + 100)}
        {--import-id= : Internal — when triggered from the admin UI, write per-page progress to this GameImport row so the progress bar can update live}
        {--force : Overwrite existing fields (default fills only blanks)}';

    protected $description = 'Import games from RAWG or Steam (covers, descriptions, release dates)';

    public function handle(RawgClient $rawg, SteamClient $steam): int
    {
        if ($this->option('preset') || $this->option('preset-file')) {
            return $this->importFromPreset($rawg, $steam);
        }

        // --new=N runs a paginated "top up" against RAWG: keep pulling
        // list pages, skip slugs we already have, fetch detail for the
        // rest, stop when we've added N new games or hit the call cap.
        if ($this->option('new')) {
            try {
                return $this->importNewFromRawg($rawg) ? self::SUCCESS : self::FAILURE;
            } catch (Throwable $e) {
                $this->error($e->getMessage());
                return self::FAILURE;
            }
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
            $genre = $this->option('genre');
            $ordering = $this->option('ordering') ?: '-added';
            $skipExisting = (bool) $this->option('skip-existing');
            $label = $genre ? "top {$top} {$genre} games" : "top {$top} games";
            $this->info("Fetching {$label} from RAWG (ordering={$ordering})…");
            $hits = $genre
                ? $rawg->byGenre($genre, (int) $top, $ordering)
                : $rawg->top((int) $top, $ordering);

            // When --skip-existing, bulk-check which slugs we already have
            // and skip their detail calls entirely. This saves ~1 API call
            // per dupe, which matters a lot on rerun-of-same-top lists.
            $existingSlugs = [];
            if ($skipExisting && $hits) {
                $existingSlugs = Game::whereIn('slug', array_column($hits, 'slug'))
                    ->pluck('slug')
                    ->flip()
                    ->toArray();
            }

            $bar = $this->output->createProgressBar(count($hits));
            $bar->start();
            $skippedExisting = 0;
            foreach ($hits as $hit) {
                if ($skipExisting && isset($existingSlugs[$hit['slug']])) {
                    $skippedExisting++;
                    $bar->advance();
                    continue;
                }
                try {
                    $candidates[] = $rawg->detail($hit['slug']);
                } catch (Throwable $e) {
                    $this->warn("\n  detail failed for {$hit['slug']}: {$e->getMessage()}");
                }
                $bar->advance();
            }
            $bar->finish();
            $this->newLine(2);
            if ($skippedExisting > 0) {
                $this->line("  Skipped {$skippedExisting} games already in DB (saved {$skippedExisting} API calls)");
            }
        }

        $this->upsertMany($candidates, fn ($d) => $this->normalizeRawg($d));
        return true;
    }

    // --- "Add N new games" incremental path ---------------------------------

    /**
     * Paginate through RAWG's /games list until we've queued N detail
     * fetches for slugs we don't already have. Each list page costs 1
     * API call and returns 40 slugs; we bulk-check them against the DB
     * first, so dupes never burn a detail call. Breaks on either the
     * target hit, a hard call-cap, RAWG's pagination ending, or two
     * empty pages in a row.
     */
    private function importNewFromRawg(RawgClient $rawg): bool
    {
        $targetNew = (int) $this->option('new');
        if ($targetNew <= 0) {
            $this->error('--new must be a positive integer.');
            return false;
        }
        $maxCalls = (int) ($this->option('max-calls') ?: ($targetNew * 2 + 100));
        $ordering = $this->option('ordering') ?: '-added';
        $genre = $this->option('genre');

        // When called from the admin UI the job passes the row id so we
        // can write per-page progress to it. Poller on the frontend picks
        // that up every 4s and renders a real progress bar.
        $importRow = null;
        if ($importId = $this->option('import-id')) {
            $importRow = GameImport::find((int) $importId);
        }

        $scope = $genre ? "{$genre} games" : 'games';
        $this->info("Adding up to {$targetNew} new {$scope} (ordering={$ordering}, call cap={$maxCalls})…");

        $totalAdded = 0;
        $totalUpdated = 0;
        $totalKept = 0;   // same-in-DB dupes we avoided detail-calling
        $totalFailed = 0;
        $totalCalls = 0;
        $listPages = 0;
        $page = 1;
        // Rolling log of the last ~30 game names we've written to the DB,
        // so the progress UI can show "just added: Cyberpunk 2077, Witcher 3, …"
        $recentlyAdded = [];

        while ($totalAdded < $targetNew && $totalCalls < $maxCalls) {
            $filters = [
                'ordering' => $ordering,
                'page_size' => 40,
                'page' => $page,
            ];
            if ($genre) {
                $filters['genres'] = $genre;
            }

            try {
                $data = $rawg->listGames($filters);
            } catch (Throwable $e) {
                $this->warn("  list page {$page} failed: {$e->getMessage()}");
                break;
            }
            $totalCalls++;
            $listPages++;
            $batch = $data['results'] ?? [];
            if (!$batch) {
                break;
            }

            $slugs = array_column($batch, 'slug');
            $existing = Game::whereIn('slug', $slugs)
                ->pluck('slug')
                ->flip()
                ->toArray();

            // Gather detail payloads for this page only; we'll upsert them
            // right after, so progress writes reflect the real DB state.
            $pageCandidates = [];
            foreach ($batch as $hit) {
                if (empty($hit['slug'])) continue;
                if (isset($existing[$hit['slug']])) {
                    $totalKept++;
                    continue;
                }
                // Headroom check: still room under both caps?
                $projectedAdded = $totalAdded + count($pageCandidates);
                if ($projectedAdded >= $targetNew || $totalCalls >= $maxCalls) {
                    break 2;
                }
                try {
                    $pageCandidates[] = $rawg->detail($hit['slug']);
                } catch (Throwable $e) {
                    $this->warn("  detail failed for {$hit['slug']}: {$e->getMessage()}");
                }
                $totalCalls++;
            }

            if ($pageCandidates) {
                $pageCounts = $this->upsertBatch($pageCandidates, fn ($d) => $this->normalizeRawg($d));
                $totalAdded += $pageCounts['added'];
                $totalUpdated += $pageCounts['updated'];
                $totalKept += $pageCounts['kept'];
                $totalFailed += $pageCounts['failed'];

                // Keep a rolling window of the latest names, newest first,
                // capped so the DB column doesn't balloon on large runs.
                if (!empty($pageCounts['added_names'])) {
                    $recentlyAdded = array_slice(
                        array_merge(array_reverse($pageCounts['added_names']), $recentlyAdded),
                        0,
                        30,
                    );
                }
            }

            // Write-back to the progress row so the admin UI sees live counts.
            // `output` doubles as the "recently added" feed — newest at top,
            // capped at 30 names, readable as a plain text tail on pollStatus.
            if ($importRow) {
                $importRow->forceFill([
                    'added' => $totalAdded,
                    'updated' => $totalUpdated,
                    'skipped' => $totalKept,
                    'failed' => $totalFailed,
                    'output' => $recentlyAdded ? implode("\n", $recentlyAdded) : null,
                ])->save();
            }

            // Heartbeat line for the tail-of-output viewer.
            $this->line(sprintf(
                '  page %d · added=%d · updated=%d · kept=%d · failed=%d · api_calls=%d',
                $page,
                $totalAdded,
                $totalUpdated,
                $totalKept,
                $totalFailed,
                $totalCalls,
            ));

            if (empty($data['next'])) {
                $this->line("  reached end of RAWG results at page {$page}.");
                break;
            }
            $page++;
        }

        $this->newLine();
        $this->line(sprintf(
            '  Scanned %d list pages, %d total API calls.',
            $listPages,
            $totalCalls,
        ));
        // Final summary line — same shape as upsertMany so the job parser works.
        $this->info("Done — added: {$totalAdded}, updated: {$totalUpdated}, kept: {$totalKept}, failed: {$totalFailed}");
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
            // RAWG's `added` is the global count of users who've added this
            // game to their RAWG profile — the best popularity signal we get
            // out of their API. Drives the default sort on /games.
            'popularity_score' => isset($data['added']) ? (int) $data['added'] : 0,
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
        $counts = $this->upsertBatch($items, $normalize);
        $this->line('');
        $this->info("Done — added: {$counts['added']}, updated: {$counts['updated']}, kept: {$counts['kept']}, failed: {$counts['failed']}");
    }

    /**
     * Core upsert loop. Returns per-category counts so callers that run
     * multiple batches (see importNewFromRawg) can aggregate the totals
     * themselves and write the single final "Done —" summary line that
     * RunGameImportJob::parseCounts() looks for. Also returns the names
     * of games actually added this batch so the admin UI can render a
     * live "recently added" feed.
     *
     * @return array{added:int, updated:int, kept:int, failed:int, added_names:array<int,string>}
     */
    private function upsertBatch(array $items, callable $normalize): array
    {
        $added = 0;
        $updated = 0;
        $kept = 0;
        $failed = 0;
        $added_names = [];

        foreach ($items as $raw) {
            $attrs = null;
            try {
                if (!$raw) { $kept++; continue; }
                $attrs = $normalize($raw);
                if (!$attrs || empty($attrs['slug'])) { $kept++; continue; }

                // Last-chance defensive normalization. The main normalizers
                // already produce clean data, but upstream API shapes change
                // — keep the DB consistent even if that happens.
                $attrs = $this->sanitize($attrs);

                $existing = Game::where('slug', $attrs['slug'])
                    ->orWhere(function ($q) use ($attrs) {
                        if (!empty($attrs['rawg_id'])) {
                            $q->where('rawg_id', $attrs['rawg_id']);
                        }
                    })
                    ->first();

                // Strip null/empty values so we never overwrite existing
                // data with nothing or blow up NOT NULL columns on create.
                $filtered = array_filter($attrs, fn ($v) => filled($v));

                if ($existing) {
                    if ($this->option('force')) {
                        $existing->fill($filtered);
                    } else {
                        $blanks = [];
                        foreach ($filtered as $key => $value) {
                            if (blank($existing->{$key})) {
                                $blanks[$key] = $value;
                            }
                        }
                        if ($blanks) {
                            $existing->fill($blanks);
                        }
                    }
                    if ($existing->isDirty()) {
                        $existing->save();
                        $updated++;
                        $this->line("  updated  {$attrs['name']}");
                    } else {
                        $kept++;
                        $this->line("  kept     {$attrs['name']}");
                    }
                } else {
                    $filtered['genre'] ??= 'Other';
                    Game::create($filtered);
                    $added++;
                    $added_names[] = $attrs['name'];
                    $this->info("  added    {$attrs['name']}");
                }
            } catch (Throwable $e) {
                $failed++;
                $name = $attrs['name'] ?? ($raw['name'] ?? 'unknown');
                $this->warn("  failed   {$name}: {$e->getMessage()}");
            }
        }

        return compact('added', 'updated', 'kept', 'failed', 'added_names');
    }

    /**
     * Defensive pass over the normalized attrs: ensure types match the DB
     * expectations regardless of upstream API weirdness.
     */
    private function sanitize(array $attrs): array
    {
        // platforms must be a flat array of non-empty strings
        if (isset($attrs['platforms'])) {
            $clean = [];
            foreach ((array) $attrs['platforms'] as $p) {
                if (is_string($p) && $p !== '') {
                    $clean[] = strtolower($p);
                } elseif (is_array($p)) {
                    $slug = $p['slug'] ?? $p['platform']['slug'] ?? $p['name'] ?? null;
                    if (is_string($slug) && $slug !== '') $clean[] = strtolower($slug);
                }
            }
            $attrs['platforms'] = array_values(array_unique($clean));
        }

        // description: text column but keep it reasonable
        if (isset($attrs['description']) && is_string($attrs['description'])) {
            $attrs['description'] = \Illuminate\Support\Str::limit(
                trim(strip_tags($attrs['description'])),
                600,
                '…',
            );
        }

        // released_at: accept YYYY-MM-DD or anything Carbon can parse
        if (!empty($attrs['released_at']) && is_string($attrs['released_at'])) {
            try {
                $attrs['released_at'] = \Carbon\Carbon::parse($attrs['released_at'])->toDateString();
            } catch (Throwable) {
                $attrs['released_at'] = null;
            }
        }

        // genre / name / slug: force to string, trim
        foreach (['genre', 'name', 'slug'] as $field) {
            if (isset($attrs[$field])) {
                $attrs[$field] = is_string($attrs[$field]) ? trim($attrs[$field]) : null;
            }
        }

        return $attrs;
    }

    /**
     * Download cover to public/images/games/{slug}.jpg, or return remote URL
     * if --no-images or download fails.
     */
    private function resolveCover(?string $remote, string $slug): ?string
    {
        if (!$remote) return null;
        // Default: keep the CDN URL. Local download is opt-in to avoid
        // issues where deploys wipe untracked files from public/.
        if (!$this->option('local-images')) return $remote;

        try {
            $response = Http::timeout(30)->get($remote);
            $body = $response->body();
            if (!$response->successful() || $body === '' || strlen($body) < 1000) {
                // Unusable response — keep the remote URL so the UI still shows *something*.
                return $remote;
            }
            $dir = public_path('images/games');
            if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
                $this->warn("  could not create images dir for {$slug}, using remote URL");
                return $remote;
            }
            $path = "{$dir}/{$slug}.jpg";
            $written = @file_put_contents($path, $body);
            if ($written === false || !is_file($path)) {
                $this->warn("  could not write cover for {$slug} (permissions?), using remote URL");
                return $remote;
            }
            return "/images/games/{$slug}.jpg";
        } catch (Throwable $e) {
            $this->warn("  image download failed for {$slug}: {$e->getMessage()}");
            return $remote;
        }
    }
}
