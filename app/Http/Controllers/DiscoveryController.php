<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Game;
use App\Models\Like;
use App\Models\Pass;
use App\Models\PlayerMatch;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DiscoveryController extends Controller
{
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $user->load(['profile', 'games']);

        $myGameIds = $user->games->pluck('id')->toArray();
        $myRegion = $user->profile?->region;
        $myLookingFor = $user->profile?->looking_for;

        // IDs to exclude (use direct queries to avoid pivot pluck issues)
        $likedIds = Like::where('liker_id', $user->id)->pluck('liked_id');
        $passedIds = Pass::where('passer_id', $user->id)->pluck('passed_id');
        $blockedByMe = Block::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedMe = Block::where('blocked_id', $user->id)->pluck('blocker_id');
        // Existing matches (e.g. referral auto-friendships don't create Like rows).
        $matchedIds = PlayerMatch::where('user_one_id', $user->id)->pluck('user_two_id')
            ->merge(PlayerMatch::where('user_two_id', $user->id)->pluck('user_one_id'));
        $excludeIds = collect([$user->id])
            ->merge($likedIds)
            ->merge($passedIds)
            ->merge($blockedByMe)
            ->merge($blockedMe)
            ->merge($matchedIds)
            ->unique()
            ->values()
            ->toArray();

        // Who liked me (for boosting priority, not revealing identity)
        $likedMeIds = Like::where('liked_id', $user->id)->pluck('liker_id')->toArray();

        $query = User::query()
            ->whereNotIn('id', $excludeIds)
            ->whereHas('profile')
            ->with(['profile', 'games']);

        // Filters
        if ($request->filled('game_id')) {
            $query->whereHas('games', fn ($q) => $q->where('games.id', $request->input('game_id')));
        }
        if ($request->filled('region')) {
            $query->whereHas('profile', fn ($q) => $q->where('region', $request->input('region')));
        }
        if ($request->filled('looking_for')) {
            $query->whereHas('profile', fn ($q) => $q->where('looking_for', $request->input('looking_for')));
        }
        if ($request->filled('platform')) {
            $query->whereHas('games', fn ($q) => $q->where('user_games.platform', $request->input('platform')));
        }

        // Get all matching players (limit to 100 for scoring)
        $players = $query->limit(100)->get();

        // Score and sort by compatibility
        $scored = $players->map(function (User $player) use ($myGameIds, $myRegion, $myLookingFor, $likedMeIds) {
            $score = 0;
            $playerGameIds = $player->games->pluck('id')->toArray();

            // Common games: +10 per shared game (most important)
            $commonGames = count(array_intersect($myGameIds, $playerGameIds));
            $score += $commonGames * 10;

            // Same region: +5
            if ($myRegion && $player->profile?->region === $myRegion) {
                $score += 5;
            }

            // Same looking_for: +3
            if ($myLookingFor && $player->profile?->looking_for === $myLookingFor) {
                $score += 3;
            }

            // They liked me (boost without revealing): +15
            if (in_array($player->id, $likedMeIds)) {
                $score += 15;
            }

            // Recently active: +4 (last hour), +2 (last day)
            if ($player->updated_at >= now()->subHour()) {
                $score += 4;
            } elseif ($player->updated_at >= now()->subDay()) {
                $score += 2;
            }

            // Reputation: reward proven good teammates, demote the few
            // that actually got flagged. Score 0 = no ratings yet, so
            // treat it as neutral to avoid starving new players.
            $reputation = (float) ($player->profile?->reputation_score ?? 0);
            if ($reputation >= 4.5) {
                $score += 4;
            } elseif ($reputation >= 4.0) {
                $score += 2;
            } elseif ($reputation > 0 && $reputation < 3.0) {
                $score -= 3;
            }

            // Has avatar: +1 (completeness signal)
            if ($player->profile?->avatar) {
                $score += 1;
            }

            // Has bio: +1
            if ($player->profile?->bio) {
                $score += 1;
            }

            $player->compatibility_score = $score;
            $player->common_game_count = $commonGames;

            return $player;
        })->sortByDesc('compatibility_score')->values();

        // Paginate manually
        $page = max(1, (int) $request->input('page', 1));
        $perPage = 20;
        $paginatedPlayers = $scored->slice(($page - 1) * $perPage, $perPage)->values();

        // Stats
        $likedByCount = Like::where('liked_id', $user->id)
            ->whereNotIn('liker_id', $likedIds) // only show count of unmatched likes
            ->count();

        // Last pass for undo
        $lastPass = Pass::where('passer_id', $user->id)
            ->latest()
            ->first();

        $regions = [
            'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam',
            'Netherlands', 'Germany', 'United Kingdom', 'France', 'Spain', 'Italy',
            'United States', 'Canada', 'Brazil', 'Japan', 'South Korea', 'Australia',
        ];

        return Inertia::render('Discovery/Index', [
            'players' => [
                'data' => $paginatedPlayers,
                'total' => $scored->count(),
            ],
            'games' => Cache::remember('games:all', 300, fn () => Game::all()->toArray()),
            'filters' => $request->only(['game_id', 'region', 'looking_for', 'platform']),
            'likedByCount' => $likedByCount,
            'lastPassId' => $lastPass?->passed_id,
            'regions' => $regions,
        ]);
    }

    public function likedYou(): Response
    {
        $user = auth()->user();
        $user->load('games');
        $myGameIds = $user->games->pluck('id')->toArray();

        // Users who liked me but I haven't liked back yet (no match)
        $likedMeIds = Like::where('liked_id', $user->id)->pluck('liker_id');
        $iLikedIds = Like::where('liker_id', $user->id)->pluck('liked_id');
        $pendingLikerIds = $likedMeIds->diff($iLikedIds);

        $players = User::whereIn('id', $pendingLikerIds)
            ->whereHas('profile')
            ->with(['profile', 'games'])
            ->get()
            ->map(function (User $player) use ($myGameIds) {
                $playerGameIds = $player->games->pluck('id')->toArray();
                $player->common_game_count = count(array_intersect($myGameIds, $playerGameIds));
                return $player;
            })
            ->sortByDesc('common_game_count')
            ->values();

        return Inertia::render('Discovery/LikedYou', [
            'players' => $players,
        ]);
    }

    public function passed(Request $request): Response
    {
        $user = auth()->user();
        $user->load('games');
        $myGameIds = $user->games->pluck('id')->toArray();

        $passedUserIds = Pass::where('passer_id', $user->id)->pluck('passed_id');

        $players = User::whereIn('id', $passedUserIds)
            ->whereHas('profile')
            ->with(['profile', 'games'])
            ->get()
            ->map(function (User $player) use ($myGameIds) {
                $playerGameIds = $player->games->pluck('id')->toArray();
                $player->common_game_count = count(array_intersect($myGameIds, $playerGameIds));
                return $player;
            })
            ->sortByDesc('common_game_count')
            ->values();

        return Inertia::render('Discovery/Passed', [
            'players' => $players,
        ]);
    }

    public function removePass(int $userId): JsonResponse
    {
        $user = auth()->user();
        Pass::where('passer_id', $user->id)->where('passed_id', $userId)->delete();

        return response()->json(['success' => true]);
    }

    public function undo(): JsonResponse
    {
        $user = auth()->user();
        $lastPass = Pass::where('passer_id', $user->id)->latest()->first();

        if (!$lastPass) {
            return response()->json(['error' => 'Nothing to undo'], 422);
        }

        $lastPass->delete();

        return response()->json(['success' => true, 'undone_id' => $lastPass->passed_id]);
    }

    public function publicIndex(Request $request): Response
    {
        $query = User::query()
            ->whereHas('profile')
            ->with(['profile', 'games']);

        if ($request->filled('game_id')) {
            $query->whereHas('games', fn ($q) => $q->where('games.id', $request->input('game_id')));
        }
        if ($request->filled('region')) {
            $query->whereHas('profile', fn ($q) => $q->where('region', $request->input('region')));
        }

        $players = $query->latest()->paginate(24)->withQueryString();

        return Inertia::render('Players/Index', [
            'players' => $players,
            'games' => Cache::remember('games:all', 300, fn () => Game::all()->toArray()),
            'filters' => $request->only(['game_id', 'region']),
            'seo' => [
                'title' => 'Browse Players · Find Verified Gamers · SquadSpawn',
                'description' => 'Browse verified gamers building real reputations on SquadSpawn. Filter by game and region — find squadmates with mics, ranked partners, and chill duos who actually show up.',
                'keywords' => 'find gamers, browse gamer profiles, verified gamers, gaming squadmates, LFG players, gaming reputation',
                'image' => url('/images/og-card.jpg'),
            ],
        ]);
    }
}
