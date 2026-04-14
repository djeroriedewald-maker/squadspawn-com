<?php

namespace App\Http\Controllers;

use App\Models\Message;
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

        $playerMatch->load(['userOne.profile', 'userTwo.profile']);

        $partner = $playerMatch->user_one_id === $user->id
            ? $playerMatch->userTwo
            : $playerMatch->userOne;

        // Mark partner's messages as read
        Message::where('match_id', $playerMatch->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        // Query messages directly (not via eager loading)
        $messages = Message::where('match_id', $playerMatch->id)
            ->with('sender')
            ->orderBy('created_at')
            ->get();

        \Log::info('Chat show', [
            'match_id' => $playerMatch->id,
            'user_id' => $user->id,
            'message_count' => $messages->count(),
            'message_ids' => $messages->pluck('id')->toArray(),
        ]);

        // Mark notifications as read for this match
        $user->unreadNotifications()
            ->where('type', NewMessageNotification::class)
            ->get()
            ->filter(fn ($n) => ($n->data['match_id'] ?? null) === $playerMatch->id)
            ->each->markAsRead();

        // Don't include messages in the match prop (avoid duplicate data)
        $playerMatch->unsetRelation('messages');

        return Inertia::render('Chat/Show', [
            'match' => $playerMatch,
            'partner' => $partner,
            'messages' => $messages,
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

        \Log::info('Chat store', [
            'match_id' => $playerMatch->id,
            'message_id' => $message->id,
            'sender_id' => $user->id,
        ]);

        $message->load('sender');

        // Send the response immediately, then handle notifications
        $partner = $playerMatch->user_one_id === $user->id
            ? $playerMatch->userTwo
            : $playerMatch->userOne;

        \Cache::forget("user:{$partner->id}:unread");

        // Notify after response is ready - wrapped to never break chat
        try {
            $partner->notify(new NewMessageNotification($message, $user, $playerMatch->id));
        } catch (\Throwable $e) {
            \Log::error('Chat notification error: ' . $e->getMessage());
        }

        return response()->json($message, HttpResponse::HTTP_CREATED);
    }

    public function poll(Request $request, PlayerMatch $playerMatch): JsonResponse
    {
        $user = auth()->user();

        if ($playerMatch->user_one_id !== $user->id && $playerMatch->user_two_id !== $user->id) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        $since = $request->input('since');

        $messages = $playerMatch->messages()
            ->with('sender.profile')
            ->when($since, fn ($q) => $q->where('created_at', '>', $since))
            ->latest()
            ->take(20)
            ->get()
            ->reverse()
            ->values();

        // Mark partner's messages as read
        $playerMatch->messages()
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'messages' => $messages,
            'timestamp' => now()->toISOString(),
        ]);
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
