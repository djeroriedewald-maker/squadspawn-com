<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\RawgClient;
use Illuminate\Console\Command;
use Throwable;

/**
 * Walk RAWG's /games endpoint in popularity (-added) order and copy each
 * row's `added` count into our games.popularity_score column. Used once
 * after the column ships to seed values for the existing catalogue, and
 * safe to re-run on cadence (weekly?) so the score stays current as RAWG
 * popularity shifts.
 *
 * Why this is cheap: each list page returns 40 games + their `added`
 * counts, no detail calls needed. Covering an 11k catalogue takes ~275
 * RAWG API calls — about 1.5% of the monthly free tier.
 */
class BackfillGamePopularity extends Command
{
    protected $signature = 'games:backfill-popularity
        {--max-pages=400 : Hard cap on RAWG list pages to scan (40 games each, so 400 = top 16k)}
        {--dry-run : Report what would change without writing}';

    protected $description = "Pull RAWG's `added` popularity score into games.popularity_score for the existing catalogue";

    public function handle(RawgClient $rawg): int
    {
        $maxPages = (int) $this->option('max-pages');
        $dryRun = (bool) $this->option('dry-run');

        $totalUpdated = 0;
        $totalScanned = 0;
        $page = 1;
        $consecutiveNoMatchPages = 0;

        $this->info("Backfilling popularity_score from RAWG (-added ordering, up to {$maxPages} pages)…");
        if ($dryRun) {
            $this->warn('Dry run — no DB writes.');
        }

        while ($page <= $maxPages) {
            try {
                $data = $rawg->listGames([
                    'ordering' => '-added',
                    'page_size' => 40,
                    'page' => $page,
                ]);
            } catch (Throwable $e) {
                $this->warn("  page {$page} failed: {$e->getMessage()}");
                break;
            }

            $batch = $data['results'] ?? [];
            if (!$batch) {
                $this->line("  empty results at page {$page}, stopping.");
                break;
            }
            $totalScanned += count($batch);

            // Bulk lookup: which slugs from this page do we actually have?
            $slugs = array_column($batch, 'slug');
            $existingIds = Game::whereIn('slug', $slugs)
                ->pluck('id', 'slug')
                ->toArray();

            $matchedThisPage = 0;
            foreach ($batch as $hit) {
                if (empty($hit['slug']) || !isset($existingIds[$hit['slug']])) continue;
                $score = (int) ($hit['added'] ?? 0);
                if ($score <= 0) continue;
                if (!$dryRun) {
                    Game::where('id', $existingIds[$hit['slug']])
                        ->update(['popularity_score' => $score]);
                }
                $totalUpdated++;
                $matchedThisPage++;
            }

            // Heartbeat every 10 pages so long runs feel alive in the tail.
            if ($page % 10 === 0) {
                $this->line(sprintf(
                    '  page %d · %d updated total · %d scanned · matched %d on this page',
                    $page,
                    $totalUpdated,
                    $totalScanned,
                    $matchedThisPage,
                ));
            }

            // Bail out early if RAWG starts returning pages with no slugs we
            // care about — we've reached the obscure tail of their catalogue.
            $consecutiveNoMatchPages = $matchedThisPage === 0
                ? $consecutiveNoMatchPages + 1
                : 0;
            if ($consecutiveNoMatchPages >= 5) {
                $this->line("  5 consecutive pages with no matches — stopping at page {$page}.");
                break;
            }

            if (empty($data['next'])) {
                $this->line("  reached end of RAWG results at page {$page}.");
                break;
            }
            $page++;
        }

        $this->newLine();
        $this->info(sprintf(
            'Done — scanned %d games across %d RAWG pages, updated popularity_score on %d rows.',
            $totalScanned,
            $page,
            $totalUpdated,
        ));

        return self::SUCCESS;
    }
}
