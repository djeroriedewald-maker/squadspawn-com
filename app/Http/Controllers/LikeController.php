<?php

namespace App\Http\Controllers;

use App\Models\Like;
use App\Models\Pass;
use App\Models\PlayerMatch;
use App\Notifications\NewMatchNotification;
use App\Services\AchievementService;
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

            // Notify both users
            $liker = auth()->user();
            $liked = \App\Models\User::find($likedId);
            $liker->notify(new NewMatchNotification($liked, $match->id));
            $liked->notify(new NewMatchNotification($liker, $match->id));
        }

        if ($mutualLike) {
            app(AchievementService::class)->check(auth()->user());
        }

        return response()->json([
            'matched' => $mutualLike,
            'match' => $match,
        ]);
    }

    public function pass(Request $request): JsonResponse
    {
        $request->validate([
            'passed_id' => ['required', 'exists:users,id'],
        ]);

        Pass::firstOrCreate([
            'passer_id' => auth()->id(),
            'passed_id' => $request->input('passed_id'),
        ]);

        return response()->json(['passed' => true]);
    }
}
