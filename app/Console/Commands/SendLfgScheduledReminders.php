<?php

namespace App\Console\Commands;

use App\Models\LfgPost;
use App\Notifications\LfgStartingSoonNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Sends a "starting soon" ping to host + accepted teammates of any open
 * scheduled LFG whose start time is within the next 15 minutes. Designed
 * to be safe to run every minute — the per-post cache lock prevents
 * double-notification on overlapping cron ticks or post-deploy restarts.
 */
class SendLfgScheduledReminders extends Command
{
    protected $signature = 'lfg:send-reminders';

    protected $description = 'Notify host + accepted teammates ~15 min before a scheduled LFG starts.';

    public function handle(): int
    {
        Cache::put('lfg:reminders:scheduler_last_run', now()->toIso8601String(), 3600);

        $now = now();
        // Window: anything starting between now and now+15min that hasn't
        // started yet. The lower bound prevents reminding sessions that
        // are already overdue (they get no value from the ping).
        $due = LfgPost::query()
            ->where('status', 'open')
            ->whereNotNull('scheduled_at')
            ->whereBetween('scheduled_at', [$now, $now->copy()->addMinutes(15)])
            ->with(['user', 'game', 'responses' => fn ($q) => $q->where('status', 'accepted')->with('user')])
            ->get();

        if ($due->isEmpty()) {
            return self::SUCCESS;
        }

        foreach ($due as $post) {
            // Atomic add — first writer wins. If a previous tick already
            // notified this post, skip. 2-hour TTL is safe: the reminder
            // window is 15 min, no scheduler will fire it twice anyway.
            if (!Cache::add("lfg:reminded:{$post->id}", true, 7200)) {
                continue;
            }

            $recipients = collect([$post->user])
                ->merge($post->responses->pluck('user'))
                ->filter()
                ->unique('id');

            foreach ($recipients as $user) {
                try {
                    $user->notify(new LfgStartingSoonNotification($post));
                } catch (\Throwable $e) {
                    Log::warning('LFG reminder failed', [
                        'lfg_post_id' => $post->id,
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            $this->info("Reminded LFG #{$post->id} ({$recipients->count()} recipients).");
        }

        return self::SUCCESS;
    }
}
