<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Nightly retention sweep. Enforces the retention windows we promise
 * in the privacy policy so AVG Art. 5(1)(e) "storage limitation" isn't
 * just aspirational.
 *
 * Each section is independent — a failure in one doesn't stop the rest.
 */
class PruneRetention extends Command
{
    protected $signature = 'prune:retention {--dry-run : count rows that would be pruned without deleting}';
    protected $description = 'Prune data past its retention window (sessions, notifications, audit log, resolved reports, swipes).';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $now = now();

        $stats = [];

        // Expired sessions: the sessions table caches IP + user-agent,
        // so we don't want rows to linger past their natural life.
        $sessionTtl = (int) config('session.lifetime', 120); // minutes
        $sessionCutoff = $now->copy()->subMinutes($sessionTtl)->getTimestamp();
        $stats['sessions_expired'] = $this->prune(
            fn () => DB::table('sessions')->where('last_activity', '<', $sessionCutoff)->count(),
            fn () => DB::table('sessions')->where('last_activity', '<', $sessionCutoff)->delete(),
            $dryRun,
        );

        // Read notifications older than 90 days. Unread notifications
        // stay forever — those are queued actions the user never saw.
        $stats['notifications_read_old'] = $this->prune(
            fn () => DB::table('notifications')
                ->whereNotNull('read_at')
                ->where('read_at', '<', $now->copy()->subDays(90))
                ->count(),
            fn () => DB::table('notifications')
                ->whereNotNull('read_at')
                ->where('read_at', '<', $now->copy()->subDays(90))
                ->delete(),
            $dryRun,
        );

        // Resolved/dismissed reports older than 180 days. Pending stays.
        if (DB::getSchemaBuilder()->hasTable('reports')) {
            $stats['reports_resolved_old'] = $this->prune(
                fn () => DB::table('reports')
                    ->whereIn('status', ['resolved', 'dismissed'])
                    ->where('updated_at', '<', $now->copy()->subDays(180))
                    ->count(),
                fn () => DB::table('reports')
                    ->whereIn('status', ['resolved', 'dismissed'])
                    ->where('updated_at', '<', $now->copy()->subDays(180))
                    ->delete(),
                $dryRun,
            );
        }

        // Admin action audit older than 2 years. AVG balance: we need
        // enough history to investigate an incident, not indefinite.
        if (DB::getSchemaBuilder()->hasTable('admin_actions')) {
            $stats['admin_actions_old'] = $this->prune(
                fn () => DB::table('admin_actions')
                    ->where('created_at', '<', $now->copy()->subYears(2))
                    ->count(),
                fn () => DB::table('admin_actions')
                    ->where('created_at', '<', $now->copy()->subYears(2))
                    ->delete(),
                $dryRun,
            );
        }

        // Discovery passes older than 180 days. The user already swiped
        // past them; retention is about platform memory, not theirs.
        if (DB::getSchemaBuilder()->hasTable('passes')) {
            $stats['passes_old'] = $this->prune(
                fn () => DB::table('passes')
                    ->where('created_at', '<', $now->copy()->subDays(180))
                    ->count(),
                fn () => DB::table('passes')
                    ->where('created_at', '<', $now->copy()->subDays(180))
                    ->delete(),
                $dryRun,
            );
        }

        // Pageview tracking rows older than 90 days. Aggregate metrics
        // on the analytics page only look back 30 days, so the tail is
        // pure storage cost with no value.
        if (DB::getSchemaBuilder()->hasTable('page_views')) {
            $stats['page_views_old'] = $this->prune(
                fn () => DB::table('page_views')
                    ->where('day', '<', $now->copy()->subDays(90)->toDateString())
                    ->count(),
                fn () => DB::table('page_views')
                    ->where('day', '<', $now->copy()->subDays(90)->toDateString())
                    ->delete(),
                $dryRun,
            );
        }

        // Dismissed broadcast views older than 1 year. Undismissed stay.
        if (DB::getSchemaBuilder()->hasTable('broadcast_views')) {
            $stats['broadcast_views_old'] = $this->prune(
                fn () => DB::table('broadcast_views')
                    ->whereNotNull('dismissed_at')
                    ->where('dismissed_at', '<', $now->copy()->subDays(365))
                    ->count(),
                fn () => DB::table('broadcast_views')
                    ->whereNotNull('dismissed_at')
                    ->where('dismissed_at', '<', $now->copy()->subDays(365))
                    ->delete(),
                $dryRun,
            );
        }

        $this->info($dryRun ? 'Dry run — nothing deleted.' : 'Retention sweep complete.');
        foreach ($stats as $label => $count) {
            $this->line(sprintf('  %-28s %d', $label, $count));
        }

        return Command::SUCCESS;
    }

    /**
     * @param  callable(): int  $count
     * @param  callable(): int  $delete
     */
    private function prune(callable $count, callable $delete, bool $dryRun): int
    {
        try {
            if ($dryRun) {
                return $count();
            }
            return $delete();
        } catch (\Throwable $e) {
            $this->warn('Prune step failed: ' . $e->getMessage());
            return 0;
        }
    }
}
