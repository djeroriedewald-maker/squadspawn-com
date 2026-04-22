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
        $due = Broadcast::whereNull('sent_at')
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get();

        if ($due->isEmpty()) {
            $this->info('No broadcasts due.');
            return self::SUCCESS;
        }

        foreach ($due as $broadcast) {
            $count = $dispatcher->dispatch($broadcast);
            $this->info("Sent broadcast #{$broadcast->id} to {$count} users.");
        }

        return self::SUCCESS;
    }
}
