<?php

namespace App\Notifications;

use App\Models\LfgPost;
use App\Models\User;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class LfgMemberLeftNotification extends Notification implements ShouldQueue
{
    use Queueable;


    public function __construct(
        public LfgPost $post,
        public User $leaver,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lfg_member_left',
            'lfg_post_id' => $this->post->id,
            'lfg_slug' => $this->post->slug,
            'lfg_title' => $this->post->title,
            'game_name' => $this->post->game?->name,
            'leaver_name' => $this->leaver->profile?->username ?? $this->leaver->name,
            'leaver_avatar' => $this->leaver->profile?->avatar,
        ];
    }

    public function pushType(): string
    {
        return 'lfg_request'; // reuse same opt-out category as join-flow events
    }

    public function toWebPush(object $notifiable): array
    {
        $leaver = $this->leaver->profile?->username ?? $this->leaver->name ?? 'A teammate';

        return [
            'title' => "{$leaver} left the squad",
            'body' => "\"{$this->post->title}\" — a spot just reopened.",
            'tag' => "lfg-left-{$this->post->id}-{$this->leaver->id}",
            'url' => "/lfg/{$this->post->slug}",
            'icon' => $this->leaver->profile?->avatar ?: '/icons/icon-192.png',
        ];
    }
}
