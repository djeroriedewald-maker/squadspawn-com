<?php

namespace App\Notifications;

use App\Models\LfgPost;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Pings host + accepted teammates ~15 minutes before a scheduled LFG
 * starts. Without this, a session that's been on the calendar for days
 * silently slips by because nobody got a heads-up. Idempotency is
 * handled by the SendLfgScheduledReminders command via a cache key —
 * this class just delivers the message.
 */
class LfgStartingSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public LfgPost $post,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lfg_starting_soon',
            'lfg_post_id' => $this->post->id,
            'lfg_slug' => $this->post->slug,
            'lfg_title' => $this->post->title,
            'game_name' => $this->post->game?->name,
            'scheduled_at' => $this->post->scheduled_at?->toIso8601String(),
        ];
    }

    public function pushType(): string
    {
        return 'lfg_starting_soon';
    }

    public function toWebPush(object $notifiable): array
    {
        $minutes = max(1, (int) round(now()->diffInMinutes($this->post->scheduled_at, false)));
        $whenLine = $minutes <= 1 ? 'starting now' : "starts in {$minutes} min";

        return [
            'title' => 'Squad up — ' . ($this->post->game?->name ?? 'LFG'),
            'body' => "\"{$this->post->title}\" {$whenLine}.",
            'tag' => "lfg-starting-soon-{$this->post->id}",
            'url' => "/lfg/{$this->post->slug}",
            'icon' => $this->post->user?->profile?->avatar ?: '/icons/icon-192.png',
            'requireInteraction' => true,
        ];
    }
}
