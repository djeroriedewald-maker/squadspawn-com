<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewMatchNotification extends Notification
{
    use Queueable;

    public function __construct(
        public User $matchedUser,
        public int $matchId,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $partnerName = $this->matchedUser->profile?->username ?? $this->matchedUser->name;

        return (new MailMessage)
            ->subject("New friend on SquadSpawn!")
            ->greeting("Hey {$notifiable->profile?->username ?? $notifiable->name}!")
            ->line("You and **{$partnerName}** are now friends! You can chat and team up.")
            ->action('Start Chatting', url("/friends/{$this->matchId}/chat"))
            ->line('Find your squad on SquadSpawn!');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_match',
            'match_id' => $this->matchId,
            'partner_id' => $this->matchedUser->id,
            'partner_name' => $this->matchedUser->profile?->username ?? $this->matchedUser->name,
            'partner_avatar' => $this->matchedUser->profile?->avatar,
        ];
    }
}
