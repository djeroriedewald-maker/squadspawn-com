<?php

namespace App\Services;

use App\Models\Clip;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Query + serialise the Creator Spotlight roster. Shared between the
 * public homepage, the authed dashboard, and the /clips index so every
 * surface shows a consistent view with no duplicated query logic.
 */
class FeaturedCreators
{
    /**
     * Returns up to $limit active-spotlight creators shaped for the
     * CreatorSpotlight React component. Already random-ordered and
     * filtered to creators that actually have at least one clip —
     * otherwise the spotlight card has nothing to show.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function list(int $limit = 5): Collection
    {
        $creators = User::query()
            ->whereHas('profile', function ($q) {
                $q->where('is_creator', true)
                    ->whereNotNull('featured_until')
                    ->where('featured_until', '>', now());
            })
            ->has('clips')
            ->with(['profile', 'games', 'clips' => fn ($q) => $q->latest()->limit(1)])
            ->inRandomOrder()
            ->take($limit)
            ->get();

        return $creators->map(fn (User $u) => self::serialise($u));
    }

    private static function serialise(User $user): array
    {
        /** @var Clip|null $topClip */
        $topClip = $user->clips->first();

        return [
            'id' => $user->id,
            'username' => $user->profile?->username,
            'avatar' => $user->profile?->avatar,
            'bio' => $user->profile?->bio,
            'reputation_score' => $user->profile?->reputation_score,
            'is_live' => (bool) $user->profile?->is_live,
            'socials' => $user->profile?->socials ?? null,
            'games' => $user->games->take(3)->map(fn ($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'slug' => $g->slug,
                'cover_image' => $g->cover_image,
            ])->values(),
            'top_clip' => $topClip ? [
                'id' => $topClip->id,
                'title' => $topClip->title,
                'url' => $topClip->url,
                'platform' => $topClip->platform,
                'thumbnail' => $topClip->thumbnail,
            ] : null,
            'clip_count' => $user->clips()->count(),
        ];
    }
}
