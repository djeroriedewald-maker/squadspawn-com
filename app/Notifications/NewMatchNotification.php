<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Notification;

class NewMatchNotification extends Notification
{
    public function __construct(
        public User $matchedUser,
        public int $matchId,
        public string $matchUuid,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_match',
            'match_id' => $this->matchId,
            'match_uuid' => $this->matchUuid,
            'partner_id' => $this->matchedUser->id,
            'partner_name' => $this->matchedUser->profile?->username ?? $this->matchedUser->name,
            'partner_avatar' => $this->matchedUser->profile?->avatar,
        ];
    }

    public function pushType(): string
    {
        return 'new_match';
    }

    public function toWebPush(object $notifiable): array
    {
        $name = $this->matchedUser->profile?->username ?? $this->matchedUser->name;
        return [
            'title' => "It's a match! 🎮",
            'body' => "{$name} liked you back — say hi before the moment cools.",
            'tag' => "match-{$this->matchId}",
            'url' => "/friends/{$this->matchUuid}/chat",
            'icon' => $this->matchedUser->profile?->avatar ?: '/icons/icon-192.png',
            'requireInteraction' => true,
        ];
    }
}
