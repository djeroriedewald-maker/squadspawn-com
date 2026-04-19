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

    /**
     * Console generations → parent family. Keeps the DB consistent with the
     * rest of the catalogue (pc, playstation, xbox, nintendo, mac, linux,
     * ios, android, web).
     */
    private const PARENT = [
        'playstation1' => 'playstation', 'playstation2' => 'playstation',
        'playstation3' => 'playstation', 'playstation4' => 'playstation',
        'playstation5' => 'playstation', 'ps-vita' => 'playstation',
        'psp' => 'playstation',
        'xbox-old' => 'xbox', 'xbox360' => 'xbox', 'xbox-one' => 'xbox',
        'xbox-series-x' => 'xbox',
        'nintendo-switch' => 'nintendo', 'nintendo-ds' => 'nintendo',
        'nintendo-3ds' => 'nintendo', 'nintendo-dsi' => 'nintendo',
        'wii' => 'nintendo', 'wii-u' => 'nintendo',
        'gamecube' => 'nintendo', 'n64' => 'nintendo',
        'game-boy' => 'nintendo', 'game-boy-advance' => 'nintendo',
        'game-boy-color' => 'nintendo', 'nes' => 'nintendo', 'snes' => 'nintendo',
        'macos' => 'mac',
        // keep as-is if they already match parent terms
    ];

    private function toParentSlug(string $slug): string
    {
        $slug = strtolower($slug);
        return self::PARENT[$slug] ?? $slug;
    }

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
                    $mapped = $this->toParentSlug($p);
                    if ($mapped !== $p) $dirty = true;
                    $cleaned[] = $mapped;
                    continue;
                }
                if (is_array($p)) {
                    $slug = $p['slug'] ?? $p['platform']['slug'] ?? $p['name'] ?? null;
                    if (is_string($slug) && $slug !== '') {
                        $cleaned[] = $this->toParentSlug($slug);
                        $dirty = true;
                        continue;
                    }
                }
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
