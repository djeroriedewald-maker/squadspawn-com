<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Game;
use App\Services\AchievementService;
use App\Services\SteamStatsClient;
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
        $reputationData = app(\App\Services\ReputationService::class)->calculate($user);
        $user->load('profile');

        $friendsCount = \App\Models\PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->count();

        $steamStats = $user->profile?->steam_id
            ? app(SteamStatsClient::class)->cachedStats($user->profile->steam_id)
            : null;

        // Host analytics (own profile only) — closed sessions + accept-rate
        // across responses the viewer has received while hosting.
        $sessionsHosted = \App\Models\LfgPost::where('user_id', $user->id)
            ->where('status', 'closed')->count();
        $responseCounts = \App\Models\LfgResponse::whereIn('lfg_post_id',
                \App\Models\LfgPost::where('user_id', $user->id)->pluck('id')
            )
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');
        $accepted = (int) ($responseCounts['accepted'] ?? 0);
        $rejected = (int) ($responseCounts['rejected'] ?? 0);
        $pending = (int) ($responseCounts['pending'] ?? 0);
        $decisionTotal = $accepted + $rejected;
        $hostAnalytics = [
            'sessions_hosted' => $sessionsHosted,
            'accepted' => $accepted,
            'rejected' => $rejected,
            'pending' => $pending,
            'accept_rate' => $decisionTotal > 0 ? (int) round(($accepted / $decisionTotal) * 100) : null,
        ];

        return Inertia::render('GameProfile/Show', [
            'profile' => $user->profile,
            'userGames' => $user->games,
            'clips' => $clips,
            'earnedAchievements' => $user->achievements,
            'reputationData' => $reputationData,
            'friendsCount' => $friendsCount,
            'steamStats' => $steamStats,
            'hostAnalytics' => $hostAnalytics,
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
            'banner_style' => ['nullable', 'in:game,preset'],
            'banner_preset' => ['nullable', 'string', 'max:32'],
            'socials' => ['nullable', 'array'],
            'socials.discord' => ['nullable', 'string', 'max:100'],
            'socials.instagram' => ['nullable', 'string', 'max:100'],
            'socials.twitter' => ['nullable', 'string', 'max:100'],
            'socials.tiktok' => ['nullable', 'string', 'max:100'],
            'socials.youtube' => ['nullable', 'string', 'max:100'],
            'socials.twitch' => ['nullable', 'string', 'max:100'],
            'socials.facebook' => ['nullable', 'string', 'max:100'],
            'is_creator' => ['nullable', 'boolean'],
            'has_mic' => ['nullable', 'boolean'],
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
            'has_mic' => $validated['has_mic'] ?? false,
            'stream_url' => $validated['stream_url'] ?? null,
            'banner_style' => $validated['banner_style'] ?? 'game',
            'banner_preset' => $validated['banner_preset'] ?? null,
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
        \Illuminate\Support\Facades\Cache::forget("user:{$user->id}:games");

        app(AchievementService::class)->check($user);

        // On first setup, send the player to their dashboard so referred
        // signups see their inviter's match straight away and everyone
        // gets a proper orientation before the swipe feed.
        $isFirstSetup = !$user->profile()->where('created_at', '<', now()->subMinute())->exists();

        if ($isFirstSetup) {
            return redirect()->route('dashboard')
                ->with('message', 'Profile created! Welcome to SquadSpawn.');
        }

        return redirect()->route('game-profile.show')
            ->with('message', 'Profile saved successfully!');
    }
}
