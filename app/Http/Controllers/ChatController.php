<?php

namespace App\Http\Controllers;

use App\Models\PlayerMatch;
use App\Notifications\NewMessageNotification;
use App\Services\AchievementService;
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

        try {
            $partner->notify(new NewMessageNotification($message, $user, $playerMatch->id));
            app(AchievementService::class)->check($user);
        } catch (\Throwable $e) {
            // Don't let notification/achievement errors break the chat
            \Log::error('Chat post-send error: ' . $e->getMessage());
        }

        // Clear notification cache so count updates
        \Cache::forget("user:{$partner->id}:unread");

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
