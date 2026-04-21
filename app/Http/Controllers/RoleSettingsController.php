<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class RoleSettingsController extends Controller
{
    /** Self-service page where mods / admins can step down from their role. */
    public function show(): Response
    {
        $user = auth()->user();
        return Inertia::render('Settings/Role', [
            'role' => [
                'is_admin' => (bool) $user->is_admin,
                'is_moderator' => (bool) $user->is_moderator,
                'is_owner' => (bool) $user->is_owner,
            ],
        ]);
    }

    /**
     * Step down from moderator. Admin role is untouched — stepping down from
     * admin requires admin separately to avoid accidental loss.
     */
    public function stepDownMod(): JsonResponse
    {
        $user = auth()->user();
        if (!$user->is_moderator) {
            return response()->json(['error' => "You're not a moderator."], 422);
        }
        $user->update(['is_moderator' => false]);
        return response()->json(['is_moderator' => false]);
    }

    /** Step down from admin. Owner can't step down. */
    public function stepDownAdmin(): JsonResponse
    {
        $user = auth()->user();
        if ($user->isOwner()) {
            return response()->json(['error' => "The platform owner's admin role is permanent."], 403);
        }
        if (!$user->is_admin) {
            return response()->json(['error' => "You're not an admin."], 422);
        }
        $user->update(['is_admin' => false]);
        return response()->json(['is_admin' => false]);
    }
}
