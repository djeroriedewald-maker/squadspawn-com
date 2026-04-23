<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WeeklyDigestNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $newPlayers,
        public int $newFriends,
        public int $unreadMessages,
        public int $activeLfg,
        public array $topGames,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $username = $notifiable->profile?->username ?? $notifiable->name;

        $mail = (new MailMessage)
            ->subject("Your Weekly SquadSpawn Digest")
            ->greeting("Hey {$username}! Here's what happened this week.");

        if ($this->newPlayers > 0) {
            $mail->line("**{$this->newPlayers} new gamers** joined who play your games.");
        }

        if ($this->newFriends > 0) {
            $mail->line("You made **{$this->newFriends} new friends** this week!");
        }

        if ($this->unreadMessages > 0) {
            $mail->line("You have **{$this->unreadMessages} unread messages** waiting for you.");
        }

        if ($this->activeLfg > 0) {
            $mail->line("**{$this->activeLfg} LFG groups** are looking for players in your games.");
        }

        if (!empty($this->topGames)) {
            $mail->line('**Trending games this week:** ' . implode(', ', $this->topGames));
        }

        $mail->action('Open SquadSpawn', url('/dashboard'))
            ->line('Find your squad. Play together. Level up.')
            ->salutation('GG, The SquadSpawn Team');

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return [];
    }
}
