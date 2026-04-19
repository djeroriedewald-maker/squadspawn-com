<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Services\RawgClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class ImportGames extends Command
{
    protected $signature = 'games:import
        {--query= : Search term (adds best match)}
        {--slug= : RAWG slug or id for a specific game}
        {--top= : Import top N most-added games from RAWG}
        {--no-images : Store the remote RAWG cover URL instead of downloading}
        {--force : Overwrite existing fields instead of only filling gaps}';

    protected $description = 'Import games from the RAWG API (covers, descriptions, release dates)';

    public function handle(RawgClient $rawg): int
    {
        $query = $this->option('query');
        $slug = $this->option('slug');
        $top = $this->option('top');

        if (!$query && !$slug && !$top) {
            $this->error('Pick one of --query, --slug, or --top.');
            $this->line('');
            $this->line('Examples:');
            $this->line('  php artisan games:import --top=40');
            $this->line('  php artisan games:import --query="Baldurs Gate 3"');
            $this->line('  php artisan games:import --slug=valorant');
            return self::INVALID;
        }

        $candidates = [];
        try {
            if ($slug) {
                $candidates = [$rawg->detail($slug)];
            } elseif ($query) {
                $hits = $rawg->search($query, 1);
                if (!$hits) {
                    $this->warn("No RAWG results for \"{$query}\".");
                    return self::SUCCESS;
                }
                $candidates = [$rawg->detail($hits[0]['slug'])];
            } elseif ($top) {
                $hits = $rawg->top((int) $top);
                $this->info("Fetched " . count($hits) . " games. Fetching detail for each…");
                foreach ($hits as $hit) {
                    try {
                        $candidates[] = $rawg->detail($hit['slug']);
                    } catch (Throwable $e) {
                        $this->warn("  detail failed for {$hit['slug']}: {$e->getMessage()}");
                    }
                }
            }
        } catch (Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $imported = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($candidates as $data) {
            if (!isset($data['id'], $data['slug'], $data['name'])) {
                $skipped++;
                continue;
            }

            $existing = Game::where('rawg_id', $data['id'])
                ->orWhere('slug', $data['slug'])
                ->first();

            $cover = $this->resolveCover($data);

            $attrs = [
                'name' => $data['name'],
                'slug' => $data['slug'],
                'rawg_id' => $data['id'],
                'description' => isset($data['description_raw'])
                    ? Str::limit(trim($data['description_raw']), 600, '…')
                    : null,
                'released_at' => $data['released'] ?? null,
                'cover_image' => $cover,
                'genre' => $this->primaryGenre($data),
                'platforms' => $this->platformSlugs($data),
            ];

            if ($existing) {
                if (!$this->option('force')) {
                    // Only fill empty fields
                    foreach ($attrs as $key => $value) {
                        if (blank($existing->{$key}) && filled($value)) {
                            $existing->{$key} = $value;
                        }
                    }
                } else {
                    $existing->fill($attrs);
                }
                if ($existing->isDirty()) {
                    $existing->save();
                    $updated++;
                    $this->line("  updated  {$data['name']}");
                } else {
                    $skipped++;
                    $this->line("  kept     {$data['name']}");
                }
            } else {
                Game::create($attrs);
                $imported++;
                $this->info("  added    {$data['name']}");
            }
        }

        $this->line('');
        $this->info("Done — added: {$imported}, updated: {$updated}, skipped: {$skipped}");
        return self::SUCCESS;
    }

    /**
     * Download the RAWG cover to public/images/games/{slug}.jpg by default,
     * or return the remote URL if --no-images is set or download fails.
     */
    private function resolveCover(array $data): ?string
    {
        $remote = $data['background_image'] ?? null;
        if (!$remote) return null;

        if ($this->option('no-images')) {
            return $remote;
        }

        try {
            $bytes = Http::timeout(30)->get($remote)->body();
            if (!$bytes) {
                return $remote;
            }
            $path = public_path("images/games/{$data['slug']}.jpg");
            if (!is_dir(dirname($path))) {
                mkdir(dirname($path), 0755, true);
            }
            file_put_contents($path, $bytes);
            return "/images/games/{$data['slug']}.jpg";
        } catch (Throwable $e) {
            $this->warn("  image download failed for {$data['slug']}: {$e->getMessage()}");
            return $remote;
        }
    }

    private function primaryGenre(array $data): ?string
    {
        $genres = $data['genres'] ?? [];
        return $genres[0]['name'] ?? null;
    }

    /**
     * RAWG gives us parent_platforms (PC, PlayStation, Xbox, Nintendo, etc.).
     * Return simple lowercase slugs matching our app's convention.
     *
     * @return array<int, string>
     */
    private function platformSlugs(array $data): array
    {
        $slugs = [];
        foreach (($data['parent_platforms'] ?? []) as $wrap) {
            if (isset($wrap['platform']['slug'])) {
                $slugs[] = $wrap['platform']['slug'];
            }
        }
        return array_values(array_unique($slugs));
    }
}
