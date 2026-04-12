<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q', '');

        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $results = User::whereHas('profile', function ($q) use ($query) {
            $q->where('username', 'like', "%{$query}%");
        })
            ->with(['profile', 'games'])
            ->take(10)
            ->get()
            ->map(fn ($user) => [
                'id' => $user->id,
                'username' => $user->profile->username,
                'avatar' => $user->profile->avatar,
                'region' => $user->profile->region,
                'games_count' => $user->games->count(),
            ]);

        return response()->json($results);
    }
}
