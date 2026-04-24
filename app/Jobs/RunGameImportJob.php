<?php

namespace App\Jobs;

use App\Models\GameImport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Throwable;

/**
 * Runs the games:import artisan command in the background from the
 * admin UI. Updates the attached GameImport row so the admin page can
 * poll progress + final counts.
 *
 * Long-running on purpose: a --top=500 pull can take 2-3 minutes due
 * to RAWG's per-request latency + our 4rps soft cap. 2h timeout gives
 * generous headroom for even the biggest batches.
 */
class RunGameImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 7200;
    public int $tries = 1;

    public function __construct(public int $importId)
    {
    }

    public function handle(): void
    {
        /** @var GameImport $import */
        $import = GameImport::find($this->importId);
        if (!$import) return;

        $import->forceFill([
            'status' => 'running',
            'started_at' => now(),
        ])->save();

        try {
            $exitCode = Artisan::call('games:import', $import->args);
            $output = Artisan::output();

            // Pull the final "Done — added: X, updated: Y, kept: Z,
            // failed: W" line out of the output so the UI has numbers
            // instead of a wall of text.
            $counts = $this->parseCounts($output);

            $import->forceFill([
                'status' => $exitCode === 0 ? 'completed' : 'failed',
                'output' => mb_substr($output, -10000), // last 10KB — enough for scrolling back
                'added' => $counts['added'] ?? 0,
                'updated' => $counts['updated'] ?? 0,
                'skipped' => $counts['skipped'] ?? 0,
                'failed' => $counts['failed'] ?? 0,
                'finished_at' => now(),
            ])->save();
        } catch (Throwable $e) {
            $import->forceFill([
                'status' => 'failed',
                'error' => $e->getMessage(),
                'finished_at' => now(),
            ])->save();
            throw $e;
        }
    }

    private function parseCounts(string $output): array
    {
        // Matches the summary line ImportGames emits:
        // "Done — added: 12, updated: 3, kept: 5, failed: 0"
        if (!preg_match('/added:\s*(\d+).*?updated:\s*(\d+).*?kept:\s*(\d+).*?failed:\s*(\d+)/i', $output, $m)) {
            return [];
        }
        return [
            'added' => (int) $m[1],
            'updated' => (int) $m[2],
            'skipped' => (int) $m[3],
            'failed' => (int) $m[4],
        ];
    }
}
