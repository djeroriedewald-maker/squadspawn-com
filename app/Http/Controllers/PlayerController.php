<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Clip;
use App\Models\PlayerMatch;
use App\Models\PlayerRating;
use App\Models\Profile;
use App\Services\ReputationService;
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
        $myRating = null;
        if ($viewer && $viewer->id !== $player->id) {
            $isFriend = PlayerMatch::where(function ($q) use ($viewer, $player) {
                $q->where('user_one_id', $viewer->id)->where('user_two_id', $player->id);
            })->orWhere(function ($q) use ($viewer, $player) {
                $q->where('user_one_id', $player->id)->where('user_two_id', $viewer->id);
            })->exists();

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

        // Steam stats — cached 1h per user to keep rate limits sane.
        $steamStats = null;
        if ($player->profile->steam_id) {
            $steamStats = \Illuminate\Support\Facades\Cache::remember(
                "steam:stats:{$player->profile->steam_id}",
                3600,
                fn () => $this->buildSteamStats($player->profile->steam_id),
            );
        }

        return Inertia::render('Player/Show', [
            'player' => $player,
            'clips' => $clips,
            'reputationData' => $reputationData,
            'friendsCount' => $friendsCount,
            'isFriend' => $isFriend,
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

    private function buildSteamStats(string $steamId64): ?array
    {
        $steam = app(\App\Services\SteamStatsClient::class);
        if (!$steam->hasKey()) return null;

        try {
            $summary = $steam->playerSummary($steamId64);
            $owned = $steam->ownedGames($steamId64);
            $recent = $steam->recentlyPlayed($steamId64);
        } catch (\Throwable) {
            return null;
        }

        if (!$summary) return null;

        // Top-5 by total playtime (minutes → hours, >1h cutoff)
        usort($owned, fn ($a, $b) => ($b['playtime_forever'] ?? 0) <=> ($a['playtime_forever'] ?? 0));
        $topGames = [];
        foreach (array_slice($owned, 0, 5) as $g) {
            if (empty($g['playtime_forever']) || $g['playtime_forever'] < 60) continue;
            $topGames[] = [
                'appid' => $g['appid'] ?? null,
                'name' => $g['name'] ?? 'Unknown',
                'hours' => round(($g['playtime_forever'] ?? 0) / 60),
                'icon' => !empty($g['img_icon_url']) && !empty($g['appid'])
                    ? "https://media.steampowered.com/steamcommunity/public/images/apps/{$g['appid']}/{$g['img_icon_url']}.jpg"
                    : null,
            ];
        }

        $totalHours = array_sum(array_column($owned, 'playtime_forever')) / 60;

        $recentClean = [];
        foreach (array_slice($recent, 0, 3) as $g) {
            $recentClean[] = [
                'name' => $g['name'] ?? 'Unknown',
                'hoursTwoWeeks' => round(($g['playtime_2weeks'] ?? 0) / 60, 1),
            ];
        }

        return [
            'personaName' => $summary['personaname'] ?? null,
            'avatar' => $summary['avatarmedium'] ?? null,
            'profileUrl' => $summary['profileurl'] ?? null,
            'visibility' => $summary['communityvisibilitystate'] ?? null,
            'ownedCount' => count($owned),
            'totalHours' => (int) round($totalHours),
            'topGames' => $topGames,
            'recent' => $recentClean,
        ];
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
