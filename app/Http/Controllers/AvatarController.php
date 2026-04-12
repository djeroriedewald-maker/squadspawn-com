<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class AvatarController extends Controller
{
    private const PRESET_AVATARS = [
        'warrior', 'mage', 'healer', 'tank', 'assassin', 'ranger',
        'dragon', 'wolf', 'phoenix', 'ghost', 'robot', 'ninja',
    ];

    public function presets(): JsonResponse
    {
        $avatars = collect(self::PRESET_AVATARS)->map(fn ($name) => [
            'name' => $name,
            'url' => "/images/avatars/{$name}.svg",
        ]);

        return response()->json($avatars);
    }

    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000'],
        ]);

        $user = auth()->user();

        // Delete old custom avatar if exists
        if ($user->profile?->avatar && str_starts_with($user->profile->avatar, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $user->profile->avatar);
            Storage::disk('public')->delete($oldPath);
        }

        // Store and resize
        $file = $request->file('avatar');
        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('avatars', $filename, 'public');

        $avatarUrl = '/storage/' . $path;

        // Update profile
        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            ['avatar' => $avatarUrl]
        );

        return response()->json([
            'url' => $avatarUrl,
            'message' => 'Avatar uploaded successfully!',
        ]);
    }

    public function setPreset(Request $request): JsonResponse
    {
        $request->validate([
            'preset' => ['required', 'string', 'in:' . implode(',', self::PRESET_AVATARS)],
        ]);

        $user = auth()->user();

        // Delete old custom avatar if exists
        if ($user->profile?->avatar && str_starts_with($user->profile->avatar, '/storage/avatars/')) {
            $oldPath = str_replace('/storage/', '', $user->profile->avatar);
            Storage::disk('public')->delete($oldPath);
        }

        $avatarUrl = "/images/avatars/{$request->preset}.svg";

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            ['avatar' => $avatarUrl]
        );

        return response()->json([
            'url' => $avatarUrl,
            'message' => 'Avatar updated!',
        ]);
    }
}
