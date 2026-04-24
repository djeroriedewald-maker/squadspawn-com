<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\RunGameImportJob;
use App\Models\Game;
use App\Models\GameImport;
use App\Services\AdminAudit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin UI for growing the games catalogue without having to SSH in.
 * Stats + recent runs + one-click trigger for common batches. Heavy
 * lifting happens in a queued RunGameImportJob.
 */
class GameImportController extends Controller
{
    // Canonical batch presets shown in the admin UI. Kept server-side
    // so the frontend can't inject arbitrary artisan args.
    private const PRESETS = [
        'top-shooter' => ['label' => 'Top 500 shooters', 'args' => ['--top' => 500, '--genre' => 'shooter', '--skip-existing' => true]],
        'top-action' => ['label' => 'Top 500 action', 'args' => ['--top' => 500, '--genre' => 'action', '--skip-existing' => true]],
        'top-rpg' => ['label' => 'Top 500 RPGs', 'args' => ['--top' => 500, '--genre' => 'role-playing-games-rpg', '--skip-existing' => true]],
        'top-strategy' => ['label' => 'Top 500 strategy', 'args' => ['--top' => 500, '--genre' => 'strategy', '--skip-existing' => true]],
        'top-sports' => ['label' => 'Top 500 sports', 'args' => ['--top' => 500, '--genre' => 'sports', '--skip-existing' => true]],
        'top-racing' => ['label' => 'Top 500 racing', 'args' => ['--top' => 500, '--genre' => 'racing', '--skip-existing' => true]],
        'top-fighting' => ['label' => 'Top 500 fighting', 'args' => ['--top' => 500, '--genre' => 'fighting', '--skip-existing' => true]],
        'top-adventure' => ['label' => 'Top 500 adventure', 'args' => ['--top' => 500, '--genre' => 'adventure', '--skip-existing' => true]],
        'top-indie' => ['label' => 'Top 500 indie', 'args' => ['--top' => 500, '--genre' => 'indie', '--skip-existing' => true]],
        'top-puzzle' => ['label' => 'Top 500 puzzle', 'args' => ['--top' => 500, '--genre' => 'puzzle', '--skip-existing' => true]],
        'top-simulation' => ['label' => 'Top 500 simulation', 'args' => ['--top' => 500, '--genre' => 'simulation', '--skip-existing' => true]],
        'top-platformer' => ['label' => 'Top 500 platformer', 'args' => ['--top' => 500, '--genre' => 'platformer', '--skip-existing' => true]],
        'alltime-1000' => ['label' => 'All-time top 1000', 'args' => ['--top' => 1000, '--skip-existing' => true]],
        'recent-300' => ['label' => 'Top 300 recent releases', 'args' => ['--top' => 300, '--ordering' => '-released', '--skip-existing' => true]],
        'metacritic-300' => ['label' => 'Top 300 by Metacritic', 'args' => ['--top' => 300, '--ordering' => '-metacritic', '--skip-existing' => true]],
        // Incremental "top-up" presets — paginate RAWG until N genuinely new
        // games have been added to the DB. Safe to re-click: each run picks
        // up where the catalogue left off because duplicates are short-circuited.
        'add-new-1000' => ['label' => 'Add 1,000 new games', 'args' => ['--new' => 1000]],
        'add-new-5000' => ['label' => 'Add 5,000 new games', 'args' => ['--new' => 5000]],
        'add-new-10000' => ['label' => 'Add 10,000 new games', 'args' => ['--new' => 10000]],
        'preset' => ['label' => 'Curated preset (games.json)', 'args' => ['--preset' => true]],
    ];

    public function show(): Response
    {
        // Catalogue stats — what's in + how complete is it
        $totalGames = Game::count();
        $withCover = Game::whereNotNull('cover_image')->count();
        $withoutCover = $totalGames - $withCover;
        $withDescription = Game::whereNotNull('description')->where('description', '!=', '')->count();
        $addedThisWeek = Game::where('created_at', '>=', now()->subWeek())->count();

        $topGenres = Game::selectRaw('COALESCE(genre, \'Other\') as genre, COUNT(*) as c')
            ->groupBy('genre')
            ->orderByDesc('c')
            ->limit(10)
            ->get();

        // Recent imports — both past runs and anything running now
        $recent = GameImport::with('triggeredBy:id,name')
            ->latest()
            ->take(25)
            ->get()
            ->map(function (GameImport $i) {
                // Target = the number the user clicked on ("Add 1,000 new games"
                // → 1000, "Top 500 shooters" → 500). Drives the progress bar
                // denominator. Null for open-ended runs (no --top / --new arg).
                $target = null;
                $args = $i->args ?? [];
                if (!empty($args['--new'])) $target = (int) $args['--new'];
                elseif (!empty($args['--top'])) $target = (int) $args['--top'];

                // "Just added" feed — the --new path writes the last N game
                // names to the output column, newest first, one per line.
                $recentlyAdded = [];
                if ($i->status === 'running' && $i->output) {
                    $recentlyAdded = array_slice(
                        array_values(array_filter(explode("\n", $i->output), fn ($l) => trim($l) !== '')),
                        0,
                        10,
                    );
                }

                return [
                    'id' => $i->id,
                    'label' => $i->label,
                    'status' => $i->status,
                    'added' => $i->added,
                    'updated' => $i->updated,
                    'skipped' => $i->skipped,
                    'failed' => $i->failed,
                    'target' => $target,
                    'recently_added' => $recentlyAdded,
                    'triggered_by' => $i->triggeredBy?->name,
                    'created_at_human' => $i->created_at?->diffForHumans(),
                    'started_at_human' => $i->started_at?->diffForHumans(),
                    'finished_at_human' => $i->finished_at?->diffForHumans(),
                    // Carbon 3 made diffIn* signed; subject is the earlier date
                    // so the "other" date (finished_at) is in the future.
                    'duration_seconds' => ($i->started_at && $i->finished_at)
                        ? (int) $i->started_at->diffInSeconds($i->finished_at)
                        : null,
                    'error' => $i->error,
                ];
            });

        $presets = collect(self::PRESETS)->map(fn ($p, $key) => [
            'key' => $key,
            'label' => $p['label'],
            // Rough API cost estimate so admins see what they're about to spend.
            'estimatedCalls' => $this->estimateCalls($p['args']),
        ])->values();

        return Inertia::render('Admin/GameImport', [
            'stats' => [
                'totalGames' => $totalGames,
                'withCover' => $withCover,
                'withoutCover' => $withoutCover,
                'withDescription' => $withDescription,
                'addedThisWeek' => $addedThisWeek,
                'coveragePct' => $totalGames > 0 ? (int) round(($withCover / $totalGames) * 100) : 0,
            ],
            'topGenres' => $topGenres,
            'recent' => $recent,
            'presets' => $presets,
            'hasRunningJob' => GameImport::whereIn('status', ['queued', 'running'])->exists(),
            'rawgBudget' => [
                'monthlyLimit' => 20000,
                // Count games actually written this month (≈ detail calls spent)
                // + ~5% for list-pagination overhead. Self-healing: doesn't rely
                // on GameImport.added which was buggy pre-67a2a8c. A game row
                // existing in the DB is proof a detail call was made to fetch it.
                'approxUsedThisMonth' => (int) round(
                    Game::where('created_at', '>=', now()->startOfMonth())->count() * 1.05
                ),
            ],
        ]);
    }

    public function trigger(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'preset' => ['required', 'string', 'in:' . implode(',', array_keys(self::PRESETS))],
        ]);

        $preset = self::PRESETS[$data['preset']];

        // Only one batch at a time — the jobs aren't designed to run in
        // parallel (RAWG rate limits bite hard if we stack requests).
        if (GameImport::whereIn('status', ['queued', 'running'])->exists()) {
            return back()->with('error', 'Another import is already running. Wait for it to finish first.');
        }

        $import = GameImport::create([
            'triggered_by_user_id' => $request->user()?->id,
            'label' => $preset['label'],
            'args' => $preset['args'],
            'status' => 'queued',
        ]);

        RunGameImportJob::dispatch($import->id);

        AdminAudit::log('games.import.trigger', null, [
            'import_id' => $import->id,
            'preset' => $data['preset'],
            'label' => $preset['label'],
        ]);

        return back()->with('message', "Import queued: {$preset['label']}. Check the runs list for progress.");
    }

    /** AJAX poll so the admin page can live-update without a full reload. */
    public function pollStatus(GameImport $gameImport): JsonResponse
    {
        return response()->json([
            'id' => $gameImport->id,
            'status' => $gameImport->status,
            'added' => $gameImport->added,
            'updated' => $gameImport->updated,
            'skipped' => $gameImport->skipped,
            'failed' => $gameImport->failed,
            'output_tail' => $gameImport->output ? mb_substr($gameImport->output, -2000) : null,
            'error' => $gameImport->error,
            'finished_at_human' => $gameImport->finished_at?->diffForHumans(),
        ]);
    }

    /**
     * Lazy-load drill-down: which games actually got written to the DB
     * during this run's window? Queried by created_at between started_at
     * and finished_at (with a small fudge before started_at so games
     * inserted in the first upsert batch still land in the window).
     */
    public function gamesAdded(GameImport $gameImport): JsonResponse
    {
        if (!$gameImport->started_at) {
            return response()->json(['games' => [], 'total' => 0]);
        }

        $from = $gameImport->started_at->copy()->subSeconds(5);
        $to = $gameImport->finished_at ?? now();

        $query = Game::query()
            ->whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at');

        $total = (clone $query)->count();
        $games = $query->limit(200)->get(['id', 'name', 'slug', 'cover_image', 'genre', 'created_at']);

        return response()->json([
            'total' => $total,
            'games' => $games->map(fn (Game $g) => [
                'id' => $g->id,
                'name' => $g->name,
                'slug' => $g->slug,
                'cover_image' => $g->cover_image,
                'genre' => $g->genre,
                'created_at_human' => $g->created_at?->diffForHumans(),
            ]),
        ]);
    }

    /**
     * Rough API-call estimate — one per game we'll actually fetch.
     * --preset pulls ~30 games; --top=N bounds at N; --new=N fetches
     * N detail calls plus list-pagination overhead (1 list call per 40
     * slugs scanned, and we'll scan some dupes on top of the N we keep).
     */
    private function estimateCalls(array $args): int
    {
        if (!empty($args['--preset'])) return 40;
        if (!empty($args['--top'])) return (int) $args['--top'] + 5;
        if (!empty($args['--new'])) {
            $n = (int) $args['--new'];
            // N detail calls + list pages for N new + ~20% dupe headroom.
            return $n + (int) ceil(($n * 1.2) / 40);
        }
        return 2;
    }
}
