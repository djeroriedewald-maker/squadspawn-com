<?php

namespace App\Notifications;

use App\Models\Broadcast;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class BroadcastNotification extends Notification implements ShouldQueue
{
    use Queueable;


    public function __construct(
        public Broadcast $broadcast,
    ) {}

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        if ($this->broadcast->push_enabled) {
            $channels[] = WebPushChannel::class;
        }
        return $channels;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'announcement',
            'broadcast_id' => $this->broadcast->id,
            'title' => $this->broadcast->title,
            'preview' => Str::limit(strip_tags((string) $this->broadcast->body_html), 120),
            'cta_url' => $this->broadcast->cta_url,
        ];
    }

    public function pushType(): string
    {
        return 'announcement';
    }

    public function toWebPush(object $notifiable): array
    {
        $body = Str::limit(strip_tags((string) $this->broadcast->body_html), 140);
        return [
            'title' => '📢 ' . $this->broadcast->title,
            'body' => $body ?: 'Open SquadSpawn to read the announcement.',
            'tag' => 'broadcast-' . $this->broadcast->id,
            'url' => $this->broadcast->cta_url ?: '/announcements',
            'icon' => $this->broadcast->image_path ? '/storage/' . $this->broadcast->image_path : '/icons/icon-192.png',
        ];
    }
}
