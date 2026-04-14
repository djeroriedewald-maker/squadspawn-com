<?php

namespace App\Notifications;

use App\Models\LfgPost;
use Illuminate\Notifications\Notification;

class LfgAcceptedNotification extends Notification
{
    public function __construct(
        public LfgPost $post,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
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
}
