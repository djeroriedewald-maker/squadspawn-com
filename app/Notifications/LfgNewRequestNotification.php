<?php

namespace App\Notifications;

use App\Models\LfgPost;
use App\Models\User;
use Illuminate\Notifications\Notification;

class LfgNewRequestNotification extends Notification
{
    public function __construct(
        public LfgPost $post,
        public User $applicant,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'lfg_request',
            'lfg_post_id' => $this->post->id,
            'lfg_slug' => $this->post->slug,
            'lfg_title' => $this->post->title,
            'game_name' => $this->post->game?->name,
            'applicant_name' => $this->applicant->profile?->username ?? $this->applicant->name,
            'applicant_avatar' => $this->applicant->profile?->avatar,
        ];
    }
}
