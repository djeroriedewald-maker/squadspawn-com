<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\RawgClient;
use Illuminate\Console\Command;
use Throwable;

/**
 * Refresh cover_image for every RAWG-sourced game back to the remote CDN URL.
 * Useful after a deploy wipes locally downloaded files.
 */
class RefetchCovers extends Command
{
    protected $signature = 'games:refetch-covers
        {--only-broken : Only refresh games whose current cover_image looks like a local path}
        {--dry-run : Preview changes without writing}';

    protected $description = 'Re-fetch cover URLs from RAWG for every game (with fallback search by name)';

    public function handle(RawgClient $rawg): int
    {
        $dry = (bool) $this->option('dry-run');
        $onlyBroken = (bool) $this->option('only-broken');

        $query = Game::query();
        if ($onlyBroken) {
            $query->where(function ($q) {
                $q->where('cover_image', 'like', '/images/%')
                  ->orWhereNull('cover_image')
                  ->orWhere('cover_image', '');
            });
        }
        $games = $query->get();

        if ($games->isEmpty()) {
            $this->info('No games match — nothing to do.');
            return self::SUCCESS;
        }

        $this->info("Refetching covers for {$games->count()} games…");
        $bar = $this->output->createProgressBar($games->count());
        $bar->start();

        $updated = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($games as $game) {
            $cover = null;
            $newRawgId = null;

            try {
                if ($game->rawg_id) {
                    // Direct fetch by ID
                    $detail = $rawg->detail((string) $game->rawg_id);
                    $cover = $detail['background_image'] ?? null;
                } else {
                    // No rawg_id → try slug first, then search by name
                    try {
                        $detail = $rawg->detail($game->slug);
                        $cover = $detail['background_image'] ?? null;
                        $newRawgId = $detail['id'] ?? null;
                    } catch (Throwable) {
                        $hits = $rawg->search($game->name, 1);
                        if ($hits) {
                            $detail = $rawg->detail($hits[0]['slug']);
                            $cover = $detail['background_image'] ?? null;
                            $newRawgId = $detail['id'] ?? null;
                        }
                    }
                }

                if (!$cover) {
                    $skipped++;
                    $bar->advance();
                    continue;
                }

                $dirty = false;
                if ($game->cover_image !== $cover) {
                    $dirty = true;
                    if (!$dry) $game->cover_image = $cover;
                }
                if ($newRawgId && !$game->rawg_id) {
                    $dirty = true;
                    if (!$dry) $game->rawg_id = $newRawgId;
                }

                if ($dirty) {
                    if (!$dry) $game->save();
                    $updated++;
                } else {
                    $skipped++;
                }
            } catch (Throwable $e) {
                $failed++;
            }
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
        $verb = $dry ? 'would update' : 'updated';
        $this->info("Done — {$verb}: {$updated}, unchanged: {$skipped}, failed: {$failed}");

        return self::SUCCESS;
    }
}
