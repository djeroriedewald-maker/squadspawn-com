<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Clip;
use App\Models\PlayerMatch;
use App\Models\PlayerRating;
use App\Models\Profile;
use App\Services\ReputationService;
use App\Services\SteamStatsClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    public function show(string $username): Response
    {
        $profile = Profile::where('username', $username)->firstOrFail();
        $player = $profile->user;
        $player->load(['profile', 'games']);

        $viewer = auth()->user();
        if ($viewer) {
            $isBlocked = Block::where('blocker_id', $player->id)
                ->where('blocked_id', $viewer->id)
                ->exists();

            if ($isBlocked) {
                abort(404);
            }
        }

        $clips = Clip::where('user_id', $player->id)
            ->with('game')
            ->latest()
            ->take(6)
            ->get();

        $reputationData = app(ReputationService::class)->calculate($player);

        $friendsCount = PlayerMatch::where('user_one_id', $player->id)
            ->orWhere('user_two_id', $player->id)
            ->count();

        // Check if viewer is friends with this player + existing rating
        $isFriend = false;
        $isFavorited = false;
        $myRating = null;
        if ($viewer && $viewer->id !== $player->id) {
            $isFriend = PlayerMatch::where(function ($q) use ($viewer, $player) {
                $q->where('user_one_id', $viewer->id)->where('user_two_id', $player->id);
            })->orWhere(function ($q) use ($viewer, $player) {
                $q->where('user_one_id', $player->id)->where('user_two_id', $viewer->id);
            })->exists();

            $isFavorited = $viewer->favoriteHosts()->where('users.id', $player->id)->exists();

            $myRating = PlayerRating::where('rater_id', $viewer->id)
                ->where('rated_id', $player->id)
                ->first();
        }

        $gameNames = $player->games->pluck('name')->take(3)->implode(', ');
        $extraGames = max($player->games->count() - 3, 0);
        $playsLine = $gameNames
            ? "Plays {$gameNames}" . ($extraGames ? " and {$extraGames} more" : '')
            : 'Gaming profile';
        $repLine = $reputationData['total_ratings'] ?? 0
            ? " · Reputation {$reputationData['score']}/5 ({$reputationData['total_ratings']} ratings)"
            : '';
        $avatarUrl = $player->profile->avatar
            ? url($player->profile->avatar)
            : url('/icons/icon-512.png');

        $steamStats = $player->profile->steam_id
            ? app(SteamStatsClient::class)->cachedStats($player->profile->steam_id)
            : null;

        return Inertia::render('Player/Show', [
            'player' => $player,
            'clips' => $clips,
            'reputationData' => $reputationData,
            'friendsCount' => $friendsCount,
            'isFriend' => $isFriend,
            'isFavorited' => $isFavorited,
            'steamStats' => $steamStats,
            'myRating' => $myRating ? [
                'score' => $myRating->score,
                'tag' => $myRating->tag,
            ] : null,
            'seo' => [
                'title' => "{$username} · Gamer Profile on SquadSpawn",
                'description' => "{$username}. {$playsLine}{$repLine}. View game profile, clips, and reputation on SquadSpawn.",
                'image' => $avatarUrl,
                'type' => 'profile',
            ],
            'jsonLd' => [
                '@context' => 'https://schema.org',
                '@type' => 'ProfilePage',
                'mainEntity' => [
                    '@type' => 'Person',
                    'name' => $username,
                    'url' => url("/player/{$username}"),
                    'image' => $avatarUrl,
                    'description' => $playsLine,
                ],
            ],
        ]);
    }

    public function rate(Request $request): JsonResponse
    {
        $user = auth()->user();

        $validated = $request->validate([
            'rated_id' => 'required|exists:users,id',
            'score' => 'required|integer|min:1|max:5',
            'tag' => 'nullable|in:great_teammate,good_comms,skilled,friendly,toxic,no_show',
        ]);

        if ((int) $validated['rated_id'] === $user->id) {
            return response()->json(['error' => 'You cannot rate yourself.'], 422);
        }

        // Must be friends to rate
        $isFriend = PlayerMatch::where(function ($q) use ($user, $validated) {
            $q->where('user_one_id', $user->id)->where('user_two_id', $validated['rated_id']);
        })->orWhere(function ($q) use ($user, $validated) {
            $q->where('user_one_id', $validated['rated_id'])->where('user_two_id', $user->id);
        })->exists();

        if (!$isFriend) {
            return response()->json(['error' => 'You can only rate friends.'], 403);
        }

        PlayerRating::updateOrCreate(
            ['rater_id' => $user->id, 'rated_id' => $validated['rated_id']],
            ['score' => $validated['score'], 'tag' => $validated['tag'] ?? null],
        );

        // Recalculate reputation
        $ratedUser = \App\Models\User::find($validated['rated_id']);
        if ($ratedUser) {
            app(ReputationService::class)->calculate($ratedUser);
        }

        return response()->json(['success' => true]);
    }
}
