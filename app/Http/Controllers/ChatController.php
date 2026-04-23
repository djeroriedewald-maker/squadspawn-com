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
    /**
     * Return friends list with last messages for the floating chat widget.
     */
    public function friends(): JsonResponse
    {
        $user = auth()->user();

        $matches = PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with(['userOne.profile', 'userTwo.profile'])
            ->latest()
            ->get()
            // Per-user "hidden" flag set via the widget trash icon. The
            // match still exists (friendship intact, the other side can
            // still message them) — they just don't see the row.
            ->reject(fn (PlayerMatch $m) => \Illuminate\Support\Facades\Cache::has("chat_hidden:{$user->id}:{$m->id}"))
            ->values();

        $matchIds = $matches->pluck('id');

        // Batch: last messages (1 query)
        $lastMessages = Message::whereIn('match_id', $matchIds)
            ->whereIn('id', function ($q) use ($matchIds) {
                $q->select(\DB::raw('MAX(id)'))->from('messages')->whereIn('match_id', $matchIds)->groupBy('match_id');
            })
            ->get()
            ->keyBy('match_id');

        // Batch: unread counts (1 query)
        $unreadCounts = Message::whereIn('match_id', $matchIds)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->select('match_id', \DB::raw('count(*) as count'))
            ->groupBy('match_id')
            ->pluck('count', 'match_id');

        $result = $matches->map(function (PlayerMatch $match) use ($user, $lastMessages, $unreadCounts) {
            $partner = $match->user_one_id === $user->id ? $match->userTwo : $match->userOne;
            $lastMessage = $lastMessages->get($match->id);

            return [
                'id' => $match->id,
                'chat_id' => $match->uuid,
                'partner' => [
                    'id' => $partner->id,
                    'name' => $partner->name,
                    'username' => $partner->profile?->username,
                    'avatar' => $partner->profile?->avatar,
                    'online' => $partner->updated_at >= now()->subMinutes(15),
                ],
                'last_message' => $lastMessage ? [
                    'body' => $lastMessage->body,
                    'sender_id' => $lastMessage->sender_id,
                    'created_at' => $lastMessage->created_at->diffForHumans(),
                ] : null,
                'unread_count' => $unreadCounts->get($match->id, 0),
            ];
        });

        return response()->json(['friends' => $result]);
    }

    /**
     * Return messages for a specific match (used by floating chat widget).
     */
    public function messages(PlayerMatch $playerMatch): JsonResponse
    {
        $user = auth()->user();

        if ($playerMatch->user_one_id !== $user->id && $playerMatch->user_two_id !== $user->id) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        // Mark partner's messages as read
        Message::where('match_id', $playerMatch->id)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::where('match_id', $playerMatch->id)
            ->with('sender.profile')
            ->orderBy('created_at')
            ->get();

        // Mark notifications for this match as read
        $user->unreadNotifications()
            ->get()
            ->filter(fn ($n) =>
                ($n->data['match_id'] ?? null) === $playerMatch->id ||
                ($n->data['match_uuid'] ?? null) === $playerMatch->uuid
            )
            ->each->markAsRead();

        \Cache::forget("user:{$user->id}:unread");

        return response()->json([
            'messages' => $messages,
            'timestamp' => now()->toISOString(),
        ]);
    }

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

        // Mark all notifications for this match as read (both message and match notifications)
        $user->unreadNotifications()
            ->get()
            ->filter(fn ($n) =>
                ($n->data['match_id'] ?? null) === $playerMatch->id ||
                ($n->data['match_uuid'] ?? null) === $playerMatch->uuid
            )
            ->each->markAsRead();

        \Cache::forget("user:{$user->id}:unread");

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

        $message->load('sender');

        // Send the response immediately, then handle notifications
        $partner = $playerMatch->user_one_id === $user->id
            ? $playerMatch->userTwo
            : $playerMatch->userOne;

        \Cache::forget("user:{$partner->id}:unread");
        // If either side had the chat hidden, a new message un-hides
        // it so they don't miss the ping.
        \Cache::forget("chat_hidden:{$user->id}:{$playerMatch->id}");
        \Cache::forget("chat_hidden:{$partner->id}:{$playerMatch->id}");

        // XP for sending messages (max 10/day)
        try {
            $dailyMsgKey = "xp_msg:{$user->id}:" . today()->toDateString();
            $dailyMsgCount = \Cache::get($dailyMsgKey, 0);
            if ($dailyMsgCount < 10) {
                \Cache::put($dailyMsgKey, $dailyMsgCount + 1, 86400);
                \App\Services\AchievementService::awardXp($user, 'message_sent');
            }
        } catch (\Throwable) {}

        // Notify after response is ready - wrapped to never break chat
        try {
            $partner->notify(new NewMessageNotification($message, $user, $playerMatch->id, $playerMatch->uuid));
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

    /**
     * Hide a chat from my own floating-widget list. The friendship,
     * messages, and other side's view stay intact — it's purely a
     * personal "I don't want to see this in my sidebar" toggle. Any
     * new incoming message will un-hide automatically (see Store).
     */
    public function hide(PlayerMatch $playerMatch): JsonResponse
    {
        $user = auth()->user();
        if ($playerMatch->user_one_id !== $user->id && $playerMatch->user_two_id !== $user->id) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }
        \Illuminate\Support\Facades\Cache::put("chat_hidden:{$user->id}:{$playerMatch->id}", now()->toIso8601String(), 86400 * 365);
        return response()->json(['ok' => true]);
    }

    /**
     * Bulk-hide multiple friend chats at once. Same guarantees as
     * single hide: friendship + messages unaffected, new messages
     * un-hide automatically. Only hides matches the caller actually
     * participates in — silently skips any foreign ids in the list.
     */
    public function bulkHide(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => 'required|array|max:100',
            'ids.*' => 'integer',
        ]);

        $user = $request->user();
        $matches = PlayerMatch::whereIn('id', $data['ids'])
            ->where(fn ($q) => $q->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id))
            ->pluck('id');

        foreach ($matches as $matchId) {
            \Illuminate\Support\Facades\Cache::put(
                "chat_hidden:{$user->id}:{$matchId}",
                now()->toIso8601String(),
                86400 * 365,
            );
        }

        return response()->json(['ok' => true, 'hidden' => $matches->count()]);
    }
}
