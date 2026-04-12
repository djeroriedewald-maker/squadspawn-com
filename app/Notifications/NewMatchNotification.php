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
            ->subject("You have a new match on SquadSpawn!")
            ->greeting("Hey {$notifiable->profile?->username ?? $notifiable->name}!")
            ->line("You matched with **{$partnerName}**! You can now chat and team up.")
            ->action('Start Chatting', url("/matches/{$this->matchId}/chat"))
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
