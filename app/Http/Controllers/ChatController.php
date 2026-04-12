<?php

namespace App\Http\Controllers;

use App\Models\PlayerMatch;
use App\Notifications\NewMessageNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ChatController extends Controller
{
    public function show(PlayerMatch $playerMatch): Response
    {
        $user = auth()->user();

        if ($playerMatch->user_one_id !== $user->id && $playerMatch->user_two_id !== $user->id) {
            abort(HttpResponse::HTTP_FORBIDDEN, 'You are not part of this match.');
        }

        $playerMatch->load(['messages.sender', 'userOne.profile', 'userTwo.profile']);

        $partner = $playerMatch->user_one_id === $user->id
            ? $playerMatch->userTwo
            : $playerMatch->userOne;

        // Mark partner's messages as read
        $playerMatch->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Reload messages so read_at is up-to-date
        $playerMatch->load('messages.sender');

        // Mark notifications as read for this match
        $user->unreadNotifications()
            ->where('type', NewMessageNotification::class)
            ->get()
            ->filter(fn ($n) => ($n->data['match_id'] ?? null) === $playerMatch->id)
            ->each->markAsRead();

        return Inertia::render('Chat/Show', [
            'match' => $playerMatch,
            'partner' => $partner,
            'messages' => $playerMatch->messages,
        ]);
    }

    public function store(Request $request, PlayerMatch $playerMatch): JsonResponse
    {
        $user = auth()->user();

        if ($playerMatch->user_one_id !== $user->id && $playerMatch->user_two_id !== $user->id) {
            abort(HttpResponse::HTTP_FORBIDDEN, 'You are not part of this match.');
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $message = $playerMatch->messages()->create([
            'sender_id' => $user->id,
            'body' => $validated['body'],
        ]);

        $message->load('sender');

        // Notify the other user
        $partner = $playerMatch->user_one_id === $user->id
            ? $playerMatch->userTwo
            : $playerMatch->userOne;

        $partner->notify(new NewMessageNotification($message, $user, $playerMatch->id));

        return response()->json($message, HttpResponse::HTTP_CREATED);
    }

    public function markRead(PlayerMatch $playerMatch): JsonResponse
    {
        $user = auth()->user();

        if ($playerMatch->user_one_id !== $user->id && $playerMatch->user_two_id !== $user->id) {
            abort(HttpResponse::HTTP_FORBIDDEN, 'You are not part of this match.');
        }

        $playerMatch->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }
}
