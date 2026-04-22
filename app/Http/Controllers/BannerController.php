<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Phase-2 profile banner upload.
 *
 * Gated behind level 2+ so wash-accounts can't be created just to
 * upload NSFW / copyright-flagged banners. The same report+moderation
 * flow we have for profiles covers follow-up.
 */
class BannerController extends Controller
{
    /** Minimum profile level required to upload a custom banner. */
    public const MIN_LEVEL = 2;

    public function upload(Request $request): JsonResponse
    {
        $user = $request->user();

        $level = (int) ($user->profile?->level ?? 1);
        if ($level < self::MIN_LEVEL) {
            throw ValidationException::withMessages([
                'banner' => 'Custom banners unlock at level ' . self::MIN_LEVEL . '. Host an LFG or rate teammates to level up.',
            ]);
        }

        $request->validate([
            'banner' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:3072', // 3 MB
                'dimensions:min_width=1200,min_height=300,max_width=3840,max_height=1500',
            ],
        ]);

        $profile = $user->profile()->firstOrCreate(['user_id' => $user->id]);

        // Nuke the previous upload so we don't accumulate orphaned files
        // on disk — user only ever has one banner at a time.
        if ($profile->banner_upload_path) {
            Storage::disk('public')->delete($profile->banner_upload_path);
        }

        $file = $request->file('banner');
        $filename = 'banner_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('banners', $filename, 'public');

        // Auto-switch the profile to upload mode so the new art is
        // visible immediately — otherwise the user has to hit save
        // after upload, which feels broken.
        $profile->update([
            'banner_upload_path' => $path,
            'banner_style' => 'upload',
        ]);

        return response()->json([
            'url' => Storage::disk('public')->url($path),
            'path' => $path,
            'banner_style' => 'upload',
            'message' => 'Banner uploaded.',
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile;
        if (!$profile) {
            return response()->json(['message' => 'No banner.'], 204);
        }

        if ($profile->banner_upload_path) {
            Storage::disk('public')->delete($profile->banner_upload_path);
        }

        $profile->update([
            'banner_upload_path' => null,
            // Fall back to game-cover mode — it always renders something
            // reasonable for any user that has at least one game.
            'banner_style' => 'game',
        ]);

        return response()->json(['banner_style' => 'game', 'message' => 'Banner removed.']);
    }
}
