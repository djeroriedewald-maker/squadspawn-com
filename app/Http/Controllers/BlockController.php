<?php

namespace App\Http\Controllers;

use App\Models\Block;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'blocked_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $userId = auth()->id();

        if ($request->blocked_id == $userId) {
            return response()->json(['message' => 'You cannot block yourself.'], 422);
        }

        Block::firstOrCreate([
            'blocker_id' => $userId,
            'blocked_id' => $request->blocked_id,
        ]);

        return response()->json(['message' => 'User blocked successfully.']);
    }

    public function destroy(int $userId): JsonResponse
    {
        Block::where('blocker_id', auth()->id())
            ->where('blocked_id', $userId)
            ->delete();

        return response()->json(['message' => 'User unblocked successfully.']);
    }
}
