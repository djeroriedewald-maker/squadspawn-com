<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\PlayerMatch;
use Inertia\Inertia;
use Inertia\Response;

class MatchController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $matches = PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with(['userOne.profile', 'userOne.games', 'userTwo.profile', 'userTwo.games'])
            ->latest()
            ->get()
            ->map(function (PlayerMatch $match) use ($user) {
                $partner = $match->user_one_id === $user->id
                    ? $match->userTwo
                    : $match->userOne;

                // Get last message for this match
                $lastMessage = Message::where('match_id', $match->id)
                    ->latest()
                    ->first();

                // Count unread messages
                $unreadCount = Message::where('match_id', $match->id)
                    ->where('sender_id', '!=', $user->id)
                    ->whereNull('read_at')
                    ->count();

                // Common games
                $userGameIds = $user->games->pluck('id')->toArray();
                $commonGames = $partner->games->filter(fn ($g) => in_array($g->id, $userGameIds))->values();

                return [
                    'id' => $match->id,
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
            'matches' => $matches,
        ]);
    }
}
