<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;

/**
 * One-shot cleanup for legacy bad data:
 *   - Games whose `platforms` column contains objects instead of strings
 *     (artefact from an early normalizer bug). Extract the slug where
 *     possible, drop anything we can't coerce.
 */
class CleanGames extends Command
{
    protected $signature = 'games:clean
        {--dry-run : Show what would change without writing}';

    protected $description = 'Repair bad data stored on games (platforms, etc.)';

    public function handle(): int
    {
        $fixed = 0;
        $dry = (bool) $this->option('dry-run');

        foreach (Game::cursor() as $game) {
            $platforms = $game->platforms;
            if (!is_array($platforms)) continue;

            $cleaned = [];
            $dirty = false;
            foreach ($platforms as $p) {
                if (is_string($p) && $p !== '') {
                    $cleaned[] = $p;
                    continue;
                }
                if (is_array($p)) {
                    // common shapes: {slug: 'pc'} OR {platform: {slug: 'pc'}}
                    $slug = $p['slug'] ?? $p['platform']['slug'] ?? $p['name'] ?? null;
                    if (is_string($slug) && $slug !== '') {
                        $cleaned[] = strtolower($slug);
                        $dirty = true;
                        continue;
                    }
                }
                // anything else (objects, null, numbers) just drop
                $dirty = true;
            }

            if ($dirty) {
                $cleaned = array_values(array_unique($cleaned));
                $this->line("  {$game->slug}: " . json_encode($platforms) . " → " . json_encode($cleaned));
                if (!$dry) {
                    $game->platforms = $cleaned;
                    $game->save();
                }
                $fixed++;
            }
        }

        $this->line('');
        if ($dry) {
            $this->info("Dry run — would fix {$fixed} games. Re-run without --dry-run to apply.");
        } else {
            $this->info("Fixed {$fixed} games.");
        }

        return self::SUCCESS;
    }
}
