<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\PlayerMatch;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MatchController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $user->load('games');

        $matches = PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with(['userOne.profile', 'userOne.games', 'userTwo.profile', 'userTwo.games'])
            ->latest()
            ->get();

        $matchIds = $matches->pluck('id');

        // Batch load last messages for all matches (1 query instead of N)
        $lastMessages = Message::whereIn('match_id', $matchIds)
            ->select('match_id', 'body', 'sender_id', 'created_at')
            ->whereIn('id', function ($query) use ($matchIds) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('messages')
                    ->whereIn('match_id', $matchIds)
                    ->groupBy('match_id');
            })
            ->get()
            ->keyBy('match_id');

        // Batch load unread counts (1 query instead of N)
        $unreadCounts = Message::whereIn('match_id', $matchIds)
            ->where('sender_id', '!=', $user->id)
            ->whereNull('read_at')
            ->select('match_id', DB::raw('count(*) as count'))
            ->groupBy('match_id')
            ->pluck('count', 'match_id');

        $userGameIds = $user->games->pluck('id')->toArray();

        $result = $matches->map(function (PlayerMatch $match) use ($user, $lastMessages, $unreadCounts, $userGameIds) {
            $partner = $match->user_one_id === $user->id
                ? $match->userTwo
                : $match->userOne;

            $lastMessage = $lastMessages->get($match->id);
            $unreadCount = $unreadCounts->get($match->id, 0);
            $commonGames = $partner->games->filter(fn ($g) => in_array($g->id, $userGameIds))->values();

            return [
                'id' => $match->id,
                'chat_id' => $match->uuid,
                'partner' => $partner,
                'created_at' => $match->created_at,
                'last_message' => $lastMessage ? [
                    'body' => $lastMessage->body,
                    'sender_id' => $lastMessage->sender_id,
                    'created_at' => $lastMessage->created_at->diffForHumans(),
                ] : null,
                'unread_count' => $unreadCount,
                'common_games' => $commonGames,
            ];
        });

        return Inertia::render('Matches/Index', [
            'matches' => $result,
        ]);
    }
}
