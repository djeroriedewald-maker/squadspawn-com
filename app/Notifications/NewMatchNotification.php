<?php

namespace App\Notifications;

use App\Models\User;
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
        return ['database'];
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
}
