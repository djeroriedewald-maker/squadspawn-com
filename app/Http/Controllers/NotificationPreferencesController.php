<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationPreferencesController extends Controller
{
    /**
     * Current preferences for the authenticated user. Missing types default
     * to enabled so the UI lights up correctly even before the user has
     * ever saved preferences.
     */
    public function show(): JsonResponse
    {
        $user = auth()->user();
        $prefs = $user->notification_preferences ?? [];
        $push = $prefs['push'] ?? [];

        $result = [];
        foreach (User::PUSH_TYPES as $type) {
            $result[$type] = !array_key_exists($type, $push) ? true : (bool) $push[$type];
        }

        return response()->json(['push' => $result]);
    }

    public function update(Request $request): JsonResponse
    {
        $pushRules = [];
        foreach (User::PUSH_TYPES as $type) {
            $pushRules["push.{$type}"] = ['sometimes', 'boolean'];
        }
        $data = $request->validate($pushRules);

        $user = $request->user();
        $prefs = $user->notification_preferences ?? [];
        $prefs['push'] = array_merge($prefs['push'] ?? [], $data['push'] ?? []);
        $user->notification_preferences = $prefs;
        $user->save();

        return response()->json(['success' => true]);
    }
}
