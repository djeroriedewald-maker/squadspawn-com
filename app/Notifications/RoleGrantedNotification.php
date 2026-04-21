<?php

namespace App\Notifications;

use App\Notifications\Channels\WebPushChannel;
use Illuminate\Notifications\Notification;

class RoleGrantedNotification extends Notification
{
    public function __construct(
        public string $role, // 'moderator' | 'admin'
        public ?string $grantedBy = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'role_change',
            'role' => $this->role,
            'granted_by' => $this->grantedBy,
        ];
    }

    public function pushType(): string
    {
        return 'role_change';
    }

    public function toWebPush(object $notifiable): array
    {
        $title = $this->role === 'admin'
            ? '👑 You\'re now an admin'
            : '🛡 You\'re now a moderator';
        $body = $this->role === 'admin'
            ? 'Full platform access granted. You can review reports, manage games, and oversee the mod team. Don\'t want this role? You can step down in your settings.'
            : 'You can now hide/lock/pin community posts and review reports. Don\'t want this role? You can step down in your settings.';

        return [
            'title' => $title,
            'body' => $body,
            'tag' => "role-{$this->role}",
            'url' => '/settings/role',
            'icon' => '/icons/icon-192.png',
            'requireInteraction' => true,
        ];
    }
}
