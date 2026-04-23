<?php

namespace App\Console\Commands;

use App\Models\Broadcast;
use App\Services\BroadcastDispatcher;
use Illuminate\Console\Command;

class DispatchScheduledBroadcasts extends Command
{
    protected $signature = 'broadcasts:dispatch-scheduled';

    protected $description = 'Send any broadcasts whose scheduled_at has passed and which have not been sent yet.';

    public function handle(BroadcastDispatcher $dispatcher): int
    {
        // Heartbeat: admin UI reads this to show "last scheduler check
        // N seconds ago", so we can tell at a glance whether Forge's
        // cron is actually executing the Laravel scheduler.
        \Illuminate\Support\Facades\Cache::put('broadcasts:scheduler_last_run', now()->toIso8601String(), 3600);

        $due = Broadcast::whereNull('sent_at')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get();

        if ($due->isEmpty()) {
            $this->info('No broadcasts due at ' . now()->toIso8601String());
            return self::SUCCESS;
        }

        foreach ($due as $broadcast) {
            try {
                $count = $dispatcher->dispatch($broadcast);
                $this->info("Sent broadcast #{$broadcast->id} to {$count} users.");
                \Illuminate\Support\Facades\Log::info("Scheduled broadcast #{$broadcast->id} dispatched", ['count' => $count]);
            } catch (\Throwable $e) {
                $this->error("Broadcast #{$broadcast->id} failed: {$e->getMessage()}");
                \Illuminate\Support\Facades\Log::error("Scheduled broadcast dispatch failed", [
                    'broadcast_id' => $broadcast->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return self::SUCCESS;
    }
}
