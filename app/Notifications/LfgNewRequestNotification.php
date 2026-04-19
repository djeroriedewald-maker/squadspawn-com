<?php

namespace App\Notifications;

use App\Models\LfgPost;
use App\Models\User;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Notification;

class LfgNewRequestNotification extends Notification
{
    public function __construct(
        public LfgPost $post,
        public User $applicant,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lfg_request',
            'lfg_post_id' => $this->post->id,
            'lfg_slug' => $this->post->slug,
            'lfg_title' => $this->post->title,
            'game_name' => $this->post->game?->name,
            'applicant_name' => $this->applicant->profile?->username ?? $this->applicant->name,
            'applicant_avatar' => $this->applicant->profile?->avatar,
        ];
    }

    public function toWebPush(object $notifiable): array
    {
        $name = $this->applicant->profile?->username ?? $this->applicant->name;
        return [
            'title' => 'New squad request',
            'body' => "{$name} wants to join \"{$this->post->title}\"",
            'tag' => "lfg-request-{$this->post->id}",
            'url' => "/lfg/{$this->post->slug}",
            'icon' => $this->applicant->profile?->avatar ?: '/icons/icon-192.png',
        ];
    }
}
