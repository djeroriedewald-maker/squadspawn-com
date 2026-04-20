<?php

namespace App\Notifications;

use App\Models\LfgPost;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Notification;

class SquadInviteNotification extends Notification
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
            'type' => 'squad_invite',
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
        return 'squad_invite';
    }

    public function toWebPush(object $notifiable): array
    {
        $hostName = $this->post->user?->profile?->username ?? $this->post->user?->name ?? 'Your former host';
        $gameName = $this->post->game?->name ?? 'a game';

        return [
            'title' => "{$hostName} reposted — you're invited first",
            'body' => "\"{$this->post->title}\" — {$gameName}. Jump back in before it opens up to the public.",
            'tag' => "squad-invite-{$this->post->id}",
            'url' => "/lfg/{$this->post->slug}",
            'icon' => $this->post->user?->profile?->avatar ?: '/icons/icon-192.png',
            'requireInteraction' => true,
        ];
    }
}
