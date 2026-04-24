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
            ->map(fn (GameImport $i) => [
                'id' => $i->id,
                'label' => $i->label,
                'status' => $i->status,
                'added' => $i->added,
                'updated' => $i->updated,
                'skipped' => $i->skipped,
                'failed' => $i->failed,
                'triggered_by' => $i->triggeredBy?->name,
                'created_at_human' => $i->created_at?->diffForHumans(),
                'started_at_human' => $i->started_at?->diffForHumans(),
                'finished_at_human' => $i->finished_at?->diffForHumans(),
                'duration_seconds' => ($i->started_at && $i->finished_at)
                    ? $i->finished_at->diffInSeconds($i->started_at)
                    : null,
                'error' => $i->error,
            ]);

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
                // Approximate usage this month — adding imports's "detail" calls only.
                // Every non-skipped game == 1 call; list-pagination overhead ignored.
                'approxUsedThisMonth' => GameImport::where('created_at', '>=', now()->startOfMonth())
                    ->sum(\Illuminate\Support\Facades\DB::raw('added + updated + failed')),
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
     * Rough API-call estimate — one per game we'll actually fetch.
     * --preset pulls ~30 games; --top=N bounds at N.
     */
    private function estimateCalls(array $args): int
    {
        if (!empty($args['--preset'])) return 40;
        if (!empty($args['--top'])) return (int) $args['--top'] + 5;
        return 2;
    }
}
