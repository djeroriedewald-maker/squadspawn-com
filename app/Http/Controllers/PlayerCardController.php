<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Public, anonymous-friendly "gamer card" page. Lets a player paste
 * /card/{username} into Twitter/Discord/Reddit and have it expand into
 * a card preview ("djero — VALORANT Diamond, mic, NA on SquadSpawn") via
 * Open Graph + Twitter Card meta tags. The visible page itself is a
 * brag-worthy callout aimed at converting visitors into squadmates.
 *
 * Mirrors FounderShareController's flow but indexes by username and
 * pulls in the user's main games for the card body.
 */
class PlayerCardController extends Controller
{
    public function show(string $username): Response
    {
        $user = User::query()
            ->whereHas('profile', fn ($q) => $q->where('username', $username))
            ->with(['profile', 'games' => fn ($q) => $q->withPivot('rank', 'role', 'platform')])
            ->first();

        if (!$user) {
            throw new NotFoundHttpException('No gamer with that username.');
        }

        $displayName = $user->profile?->username ?? $user->name;
        $games = $user->games->take(3)->map(fn ($g) => [
            'name' => $g->name,
            'slug' => $g->slug,
            'cover_image' => $g->cover_image,
            'rank' => $g->pivot?->rank,
            'role' => $g->pivot?->role,
            'platform' => $g->pivot?->platform,
        ])->values();

        $headlineGames = $games->take(2)->pluck('name')->implode(' + ');
        $title = "{$displayName} on SquadSpawn"
            . ($headlineGames ? " — {$headlineGames}" : '');

        $reputation = $user->profile?->reputation_score;
        $description = trim(implode(' · ', array_filter([
            $headlineGames ?: null,
            $user->profile?->region ?? null,
            $reputation ? "★ {$reputation} reputation" : null,
            $user->profile?->has_mic ? 'mic' : null,
            $user->is_og_founder ? 'OG Founder' : ($user->founder_number ? "Founding Member #{$user->founder_number}" : null),
        ]))) ?: "Find squadmates for ranked, casual, or chill sessions on SquadSpawn.";

        return Inertia::render('Player/Card', [
            'player' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->profile?->username,
                'avatar' => $user->profile?->avatar,
                'bio' => $user->profile?->bio,
                'region' => $user->profile?->region,
                'looking_for' => $user->profile?->looking_for,
                'has_mic' => (bool) $user->profile?->has_mic,
                'is_live' => (bool) $user->profile?->is_live,
                'reputation_score' => $reputation,
                'level' => $user->profile?->level ?? null,
                'founder_number' => $user->founder_number,
                'is_og_founder' => (bool) $user->is_og_founder,
                'joined_human' => $user->created_at?->format('F Y'),
                'games' => $games,
            ],
            'seo' => [
                'title' => $title,
                'description' => "{$displayName} · {$description}",
                'image' => $this->absoluteAvatarUrl($user->profile?->avatar),
                'image_alt' => "{$displayName} — gamer card on SquadSpawn",
                'noindex' => false,
            ],
        ]);
    }

    private function absoluteAvatarUrl(?string $avatar): ?string
    {
        if (!$avatar) return null;
        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
            return $avatar;
        }
        return url($avatar);
    }
}
