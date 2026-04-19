<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Expose the VAPID public key + current subscription state to the SPA.
     */
    public function config(): JsonResponse
    {
        $userId = auth()->id();
        $hasSubscription = $userId
            ? PushSubscription::where('user_id', $userId)->exists()
            : false;

        return response()->json([
            'vapidPublicKey' => config('services.webpush.vapid.public_key'),
            'subscribed' => $hasSubscription,
        ]);
    }

    /**
     * Store (or refresh) a push subscription for the current user. Safe to
     * call repeatedly — same endpoint just updates keys.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
        ]);

        PushSubscription::updateOrCreate(
            ['endpoint_hash' => PushSubscription::hashEndpoint($data['endpoint'])],
            [
                'user_id' => auth()->id(),
                'endpoint' => $data['endpoint'],
                'p256dh' => $data['keys']['p256dh'],
                'auth_token' => $data['keys']['auth'],
                'user_agent' => substr((string) $request->userAgent(), 0, 255),
            ],
        );

        return response()->json(['success' => true]);
    }

    /**
     * Remove a subscription by endpoint. Called when the user disables
     * push from settings or when the browser reports the subscription
     * is no longer valid.
     */
    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string'],
        ]);

        PushSubscription::where('user_id', auth()->id())
            ->where('endpoint_hash', PushSubscription::hashEndpoint($data['endpoint']))
            ->delete();

        return response()->json(['success' => true]);
    }
}
