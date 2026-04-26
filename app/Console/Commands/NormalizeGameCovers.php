<?php

namespace App\Console\Commands;

use App\Models\Game;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Rewrite RAWG cover URLs that point at api.rawg.io to media.rawg.io.
 *
 * RAWG returns image URLs on either subdomain depending on the endpoint,
 * but only `media.rawg.io` serves the /media/crop/W/H/ resize endpoint
 * we use to cut bandwidth on game cards. URLs stored with `api.rawg.io`
 * 404 the moment our frontend rewrites them through the resizer.
 *
 * Idempotent — re-running on a clean catalogue is a no-op. The frontend
 * also handles the rewrite at render time, but normalising the data
 * keeps every other surface (sitemap, OG tags, admin) consistent.
 */
class NormalizeGameCovers extends Command
{
    protected $signature = 'games:normalize-covers
        {--dry-run : Preview changes without writing}';

    protected $description = 'Rewrite cover_image URLs from api.rawg.io to media.rawg.io';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $count = Game::where('cover_image', 'like', '%api.rawg.io%')->count();

        if ($count === 0) {
            $this->info('No games with api.rawg.io covers — nothing to do.');
            return self::SUCCESS;
        }

        $this->info(sprintf('Found %d game(s) with api.rawg.io covers.', $count));

        if ($dry) {
            Game::where('cover_image', 'like', '%api.rawg.io%')
                ->take(10)
                ->get(['id', 'name', 'cover_image'])
                ->each(fn ($g) => $this->line(sprintf(
                    '  #%d %s → %s',
                    $g->id,
                    $g->name,
                    str_replace('api.rawg.io', 'media.rawg.io', $g->cover_image)
                )));
            $this->warn('Dry run — no rows updated.');
            return self::SUCCESS;
        }

        $updated = Game::where('cover_image', 'like', '%api.rawg.io%')
            ->update([
                'cover_image' => DB::raw("REPLACE(cover_image, 'api.rawg.io', 'media.rawg.io')"),
            ]);

        // Bust the homepage rotation cache so the next pageload sees the
        // freshly normalised URLs without waiting 5 minutes.
        Cache::forget('home:topgames');

        $this->info(sprintf('Updated %d row(s) and cleared home:topgames cache.', $updated));
        return self::SUCCESS;
    }
}
