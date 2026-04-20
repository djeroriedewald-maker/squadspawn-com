<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class FavoriteHostController extends Controller
{
    /** Mark a host as favourite. No-op if already favourited. */
    public function store(User $user): JsonResponse
    {
        $viewer = auth()->user();
        if ($viewer->id === $user->id) {
            return response()->json(['error' => "Can't favourite yourself."], 422);
        }

        $viewer->favoriteHosts()->syncWithoutDetaching([$user->id]);

        return response()->json(['favorited' => true]);
    }

    /** Un-favourite. */
    public function destroy(User $user): JsonResponse
    {
        auth()->user()->favoriteHosts()->detach($user->id);

        return response()->json(['favorited' => false]);
    }
}
