<?php

namespace App\Notifications;

use App\Models\Message;
use App\Models\User;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification
{
    public function __construct(
        public Message $message,
        public User $sender,
        public int $matchId,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_message',
            'match_id' => $this->matchId,
            'sender_id' => $this->sender->id,
            'sender_name' => $this->sender->profile?->username ?? $this->sender->name,
            'sender_avatar' => $this->sender->profile?->avatar,
            'message_preview' => str()->limit($this->message->body, 50),
        ];
    }
}
