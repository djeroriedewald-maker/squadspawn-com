<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ThemeController extends Controller
{
    /**
     * Persist the logged-in user's theme preference. Anonymous users fall
     * back to localStorage on the client.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'preference' => ['required', 'in:auto,light,dark'],
        ]);

        $profile = auth()->user()?->profile;
        if ($profile) {
            $profile->theme_preference = $data['preference'];
            $profile->save();
        }

        return response()->json(['preference' => $data['preference']]);
    }
}
