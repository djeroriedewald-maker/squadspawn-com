<?php

namespace App\Notifications;

use App\Models\Message;
use App\Models\User;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification
{
    public function __construct(
        public Message $message,
        public User $sender,
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
            'type' => 'new_message',
            'match_id' => $this->matchId,
            'match_uuid' => $this->matchUuid,
            'sender_id' => $this->sender->id,
            'sender_name' => $this->sender->profile?->username ?? $this->sender->name,
            'sender_avatar' => $this->sender->profile?->avatar,
            'message_preview' => str()->limit($this->message->body, 50),
        ];
    }

    public function pushType(): string
    {
        return 'new_message';
    }

    public function toWebPush(object $notifiable): array
    {
        $name = $this->sender->profile?->username ?? $this->sender->name;
        return [
            'title' => $name,
            'body' => str()->limit($this->message->body, 120),
            'tag' => "message-{$this->matchId}",
            'url' => "/friends/{$this->matchUuid}/chat",
            'icon' => $this->sender->profile?->avatar ?: '/icons/icon-192.png',
        ];
    }
}
