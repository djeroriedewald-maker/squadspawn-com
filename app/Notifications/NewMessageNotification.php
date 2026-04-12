<?php

namespace App\Notifications;

use App\Models\Message;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMessageNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Message $message,
        public User $sender,
        public int $matchId,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $senderName = $this->sender->profile?->username ?? $this->sender->name;

        return (new MailMessage)
            ->subject("New message from {$senderName} on SquadSpawn")
            ->greeting("Hey {$notifiable->profile?->username ?? $notifiable->name}!")
            ->line("{$senderName} sent you a message:")
            ->line("\"{$this->message->body}\"")
            ->action('Reply Now', url("/friends/{$this->matchId}/chat"))
            ->line('Find your squad on SquadSpawn!');
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
