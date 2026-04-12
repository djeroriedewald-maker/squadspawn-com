<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\PlayerMatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'liked_id' => ['required', 'exists:users,id'],
        ]);

        $likerId = auth()->id();
        $likedId = $request->input('liked_id');

        // Prevent self-like
        if ($likerId === (int) $likedId) {
            return response()->json(['message' => 'You cannot like yourself.'], 422);
        }

        // Create the like (ignore if already exists)
        Like::firstOrCreate([
            'liker_id' => $likerId,
            'liked_id' => $likedId,
        ]);

        // Check for mutual like
        $mutualLike = Like::where('liker_id', $likedId)
            ->where('liked_id', $likerId)
            ->exists();

        $match = null;

        if ($mutualLike) {
            // Create match with lower user_id as user_one_id
            $match = PlayerMatch::firstOrCreate([
                'user_one_id' => min($likerId, $likedId),
                'user_two_id' => max($likerId, $likedId),
            ]);

            $match->load(['userOne.profile', 'userTwo.profile']);
        }

        return response()->json([
            'matched' => $mutualLike,
            'match' => $match,
        ]);
    }

    public function pass(Request $request): JsonResponse
    {
        $request->validate([
            'liked_id' => ['required', 'exists:users,id'],
        ]);

        // For MVP, we store a pass as a like with a sentinel or simply
        // record it so the user won't be shown again. We reuse the likes
        // table conceptually -- but to keep "like" clean, we just return
        // success. The discovery query already excludes liked users, so
        // passing is a no-op for now. A dedicated "passes" table could
        // be added later.

        return response()->json(['passed' => true]);
    }
}
