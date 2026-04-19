<?php

namespace App\Notifications\Channels;

use App\Models\PushSubscription;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

class WebPushChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (!method_exists($notification, 'toWebPush')) {
            return;
        }

        $payload = $notification->toWebPush($notifiable);
        if (!$payload) return;

        $config = config('services.webpush.vapid');
        if (empty($config['public_key']) || empty($config['private_key'])) {
            // Skip silently if VAPID isn't configured — this lets development
            // run without push keys set.
            return;
        }

        $subscriptions = method_exists($notifiable, 'pushSubscriptions')
            ? $notifiable->pushSubscriptions()->get()
            : collect();

        if ($subscriptions->isEmpty()) return;

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => $config['subject'] ?? 'mailto:support@squadspawn.com',
                    'publicKey' => $config['public_key'],
                    'privateKey' => $config['private_key'],
                ],
            ]);
        } catch (Throwable $e) {
            Log::error("WebPush init failed: {$e->getMessage()}");
            return;
        }

        $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        foreach ($subscriptions as $sub) {
            /** @var PushSubscription $sub */
            try {
                $webPush->queueNotification(
                    Subscription::create([
                        'endpoint' => $sub->endpoint,
                        'publicKey' => $sub->p256dh,
                        'authToken' => $sub->auth_token,
                    ]),
                    $body,
                );
            } catch (Throwable $e) {
                Log::warning("WebPush queue failed for sub {$sub->id}: {$e->getMessage()}");
            }
        }

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) continue;

            $code = $report->getResponse()?->getStatusCode();
            // 404 Not Found or 410 Gone = subscription is dead; drop it.
            if ($code === 404 || $code === 410) {
                PushSubscription::where('endpoint_hash', PushSubscription::hashEndpoint($report->getRequest()->getUri()->__toString()))
                    ->delete();
            } else {
                Log::info("WebPush delivery failed ({$code}): {$report->getReason()}");
            }
        }
    }
}
