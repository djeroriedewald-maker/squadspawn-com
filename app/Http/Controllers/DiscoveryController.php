<?php

namespace App\Http\Controllers;

use App\Models\Block;
use App\Models\Game;
use App\Models\Like;
use App\Models\Pass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        // IDs to exclude
        $likedIds = $user->likedUsers()->pluck('liked_id');
        $passedIds = Pass::where('passer_id', $user->id)->pluck('passed_id');
        $blockedByMe = Block::where('blocker_id', $user->id)->pluck('blocked_id');
        $blockedMe = Block::where('blocked_id', $user->id)->pluck('blocker_id');
        $excludeIds = $likedIds->merge($passedIds)->merge($blockedByMe)->merge($blockedMe)->push($user->id);

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
            'games' => Game::all(),
            'filters' => $request->only(['game_id', 'region', 'looking_for', 'platform']),
            'likedByCount' => $likedByCount,
            'lastPassId' => $lastPass?->passed_id,
            'regions' => $regions,
        ]);
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
            'games' => Game::all(),
            'filters' => $request->only(['game_id', 'region']),
        ]);
    }
}
