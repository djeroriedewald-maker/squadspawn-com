<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Game;
use App\Services\AchievementService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GameProfileController extends Controller
{
    public function show(): Response
    {
        $user = auth()->user();
        $user->load(['profile', 'games', 'achievements']);

        $clips = Clip::where('user_id', $user->id)->with('game')->latest()->take(6)->get();

        // Recalculate reputation
        app(\App\Services\ReputationService::class)->calculate($user);
        $user->load('profile'); // Reload to get updated reputation_score

        return Inertia::render('GameProfile/Show', [
            'profile' => $user->profile,
            'userGames' => $user->games,
            'clips' => $clips,
            'earnedAchievements' => $user->achievements,
        ]);
    }

    public function edit(): Response
    {
        $user = auth()->user();
        $user->load(['profile', 'games']);

        return Inertia::render('GameProfile/Edit', [
            'profile' => $user->profile,
            'userGames' => $user->games,
            'games' => Game::all(),
        ]);
    }

    public function update(Request $request)
    {
        $user = auth()->user();

        $validated = $request->validate([
            'username' => ['required', 'string', 'max:50', 'unique:profiles,username,' . ($user->profile?->id ?? 'NULL')],
            'bio' => ['nullable', 'string', 'max:500'],
            'looking_for' => ['nullable', 'in:casual,ranked,friends,any'],
            'region' => ['nullable', 'string', 'max:50'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'available_times' => ['nullable', 'array'],
            'avatar' => ['nullable', 'string', 'max:255'],
            'socials' => ['nullable', 'array'],
            'socials.discord' => ['nullable', 'string', 'max:100'],
            'socials.instagram' => ['nullable', 'string', 'max:100'],
            'socials.twitter' => ['nullable', 'string', 'max:100'],
            'socials.tiktok' => ['nullable', 'string', 'max:100'],
            'socials.youtube' => ['nullable', 'string', 'max:100'],
            'socials.twitch' => ['nullable', 'string', 'max:100'],
            'socials.facebook' => ['nullable', 'string', 'max:100'],
            'is_creator' => ['nullable', 'boolean'],
            'stream_url' => ['nullable', 'url', 'max:255', new \App\Rules\SafeUrl],
            'games' => ['nullable', 'array'],
            'games.*.game_id' => ['required', 'exists:games,id'],
            'games.*.rank' => ['nullable', 'string', 'max:50'],
            'games.*.role' => ['nullable', 'string', 'max:50'],
            'games.*.platform' => ['nullable', 'string', 'max:50'],
        ]);

        // Update or create the profile (avatar is managed separately via AvatarController)
        $profileData = [
            'username' => $validated['username'],
            'bio' => $validated['bio'] ?? null,
            'looking_for' => $validated['looking_for'] ?? null,
            'region' => $validated['region'] ?? null,
            'timezone' => $validated['timezone'] ?? null,
            'available_times' => $validated['available_times'] ?? null,
            'socials' => $validated['socials'] ?? null,
            'is_creator' => $validated['is_creator'] ?? false,
            'stream_url' => $validated['stream_url'] ?? null,
        ];

        $user->profile()->updateOrCreate(
            ['user_id' => $user->id],
            $profileData
        );

        // Sync user games
        if (isset($validated['games'])) {
            $syncData = [];
            foreach ($validated['games'] as $game) {
                $syncData[$game['game_id']] = [
                    'rank' => $game['rank'] ?? null,
                    'role' => $game['role'] ?? null,
                    'platform' => $game['platform'] ?? null,
                ];
            }
            $user->games()->sync($syncData);
        } else {
            $user->games()->detach();
        }

        app(AchievementService::class)->check($user);

        // If this was the first time setup, redirect to discovery
        $isFirstSetup = !$user->profile()->where('created_at', '<', now()->subMinute())->exists();

        if ($isFirstSetup) {
            return redirect()->route('discovery.index')
                ->with('message', 'Profile created! Start discovering players.');
        }

        return redirect()->route('game-profile.show')
            ->with('message', 'Profile saved successfully!');
    }
}
