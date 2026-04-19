<?php

namespace App\Notifications;

use App\Models\LfgPost;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Notification;

class LfgAcceptedNotification extends Notification
{
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
            'type' => 'lfg_accepted',
            'lfg_post_id' => $this->post->id,
            'lfg_slug' => $this->post->slug,
            'lfg_title' => $this->post->title,
            'game_name' => $this->post->game?->name,
            'host_name' => $this->post->user?->profile?->username ?? $this->post->user?->name,
            'host_avatar' => $this->post->user?->profile?->avatar,
        ];
    }

    public function pushType(): string
    {
        return 'lfg_accepted';
    }

    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => "You're in! 🎯",
            'body' => "You joined \"{$this->post->title}\" — time to squad up.",
            'tag' => "lfg-accepted-{$this->post->id}",
            'url' => "/lfg/{$this->post->slug}",
            'icon' => $this->post->user?->profile?->avatar ?: '/icons/icon-192.png',
            'requireInteraction' => true,
        ];
    }
}
