<?php

namespace App\Console\Commands;

use App\Models\Game;
use App\Models\LfgPost;
use App\Models\Like;
use App\Models\Message;
use App\Models\PlayerMatch;
use App\Models\User;
use App\Models\UserGame;
use App\Notifications\WeeklyDigestNotification;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('digest:send-weekly')]
#[Description('Send weekly digest email to all active users')]
class SendWeeklyDigest extends Command
{
    public function handle(): void
    {
        $users = User::whereHas('profile')->with(['profile', 'games'])->get();
        $weekAgo = now()->subWeek();

        $this->info("Sending weekly digest to {$users->count()} users...");

        foreach ($users as $user) {
            $userGameIds = $user->games->pluck('id')->toArray();

            // New players this week who play same games
            $newPlayers = 0;
            if (!empty($userGameIds)) {
                $newPlayers = User::where('id', '!=', $user->id)
                    ->where('created_at', '>=', $weekAgo)
                    ->whereHas('games', fn ($q) => $q->whereIn('games.id', $userGameIds))
                    ->count();
            }

            // New friends this week
            $newFriends = PlayerMatch::where('created_at', '>=', $weekAgo)
                ->where(fn ($q) => $q->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id))
                ->count();

            // Unread messages
            $unreadMessages = Message::where('sender_id', '!=', $user->id)
                ->whereNull('read_at')
                ->whereHas('match', fn ($q) => $q->where('user_one_id', $user->id)->orWhere('user_two_id', $user->id))
                ->count();

            // Active LFG groups for user's games
            $activeLfg = 0;
            if (!empty($userGameIds)) {
                $activeLfg = LfgPost::where('status', 'open')
                    ->whereIn('game_id', $userGameIds)
                    ->count();
            }

            // Top trending games this week
            $topGames = Game::withCount(['users' => fn ($q) => $q->where('user_games.created_at', '>=', $weekAgo)])
                ->orderByDesc('users_count')
                ->take(3)
                ->pluck('name')
                ->toArray();

            // Only send if there's something to report
            if ($newPlayers > 0 || $newFriends > 0 || $unreadMessages > 0 || $activeLfg > 0) {
                $user->notify(new WeeklyDigestNotification(
                    $newPlayers,
                    $newFriends,
                    $unreadMessages,
                    $activeLfg,
                    $topGames,
                ));
                $this->line("  Sent to {$user->profile->username}");
            }
        }

        $this->info('Weekly digest sent successfully!');
    }
}
