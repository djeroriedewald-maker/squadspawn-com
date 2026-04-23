<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

/**
 * Sent to every admin when a contact-form message lands, so they
 * see a red dot on the notification bell + optionally get a push.
 * Respects the user's `admin_new_contact_message` push preference
 * (auto-managed by the NotificationPreferences component).
 */
class AdminNewContactMessageNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public ContactMessage $message)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', WebPushChannel::class];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'admin_new_contact_message',
            'message_id' => $this->message->id,
            'subject' => $this->message->subject,
            'category' => $this->message->category,
            'from_name' => $this->message->name,
            'url' => route('admin.messages.index', [], false),
        ];
    }

    public function pushType(): string
    {
        return 'admin_new_contact_message';
    }

    public function toWebPush(object $notifiable): array
    {
        $cat = \App\Models\ContactMessage::CATEGORIES[$this->message->category] ?? 'Message';
        return [
            'title' => "📬 New contact: {$cat}",
            'body' => $this->message->subject,
            'url' => '/admin/messages',
            'tag' => 'admin-contact-' . $this->message->id,
        ];
    }
}
