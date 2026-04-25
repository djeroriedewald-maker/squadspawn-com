<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Public, anonymous-friendly "founder card" page. Lets a Founding Member
 * paste /founder/3 into Twitter/Discord/Reddit and have it expand into a
 * card preview ("Djero is Founding Member #3 of 500 on SquadSpawn") via
 * Open Graph + Twitter Card meta tags. The visible page itself is a
 * brag-worthy callout aimed at converting visitors into the next founders.
 */
class FounderShareController extends Controller
{
    public function show(int $number): Response
    {
        $user = User::with('profile')->find($number);

        if (!$user || (!$user->founder_number && !$user->is_og_founder)) {
            throw new NotFoundHttpException('No founder with that number.');
        }

        $displayName = $user->profile?->username ?? $user->name;
        $joinedHuman = $user->created_at?->format('F Y');
        $tier = $user->is_og_founder ? 'OG Founder' : "Founding Member #{$user->founder_number}";

        $title = "{$displayName} is {$tier} on SquadSpawn";
        $description = $user->is_og_founder
            ? "{$displayName} was hand-picked as a day-zero founder of SquadSpawn — the gaming platform built around real squads, real reputation, no shadow-bans. Joined {$joinedHuman}. Want a permanent founder badge of your own?"
            : "{$displayName} grabbed Founding Member #{$user->founder_number} of 500 on SquadSpawn. Joined {$joinedHuman}. The first 500 members get this badge for life — there are still spots left.";

        return Inertia::render('Founder/Show', [
            'founder' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->profile?->username,
                'avatar' => $user->profile?->avatar,
                'founder_number' => $user->founder_number,
                'is_og_founder' => (bool) $user->is_og_founder,
                'joined_human' => $joinedHuman,
            ],
            'seo' => [
                'title' => $title,
                'description' => $description,
                'image' => $this->absoluteAvatarUrl($user->profile?->avatar),
                'image_alt' => "{$displayName} — {$tier} on SquadSpawn",
                'noindex' => false,
            ],
        ]);
    }

    /**
     * Avatars are sometimes stored as relative paths (/storage/...) and
     * sometimes as absolute URLs (S3, gravatar). OG scrapers need absolute
     * URLs, so normalise here.
     */
    private function absoluteAvatarUrl(?string $avatar): ?string
    {
        if (!$avatar) return null;
        if (str_starts_with($avatar, 'http://') || str_starts_with($avatar, 'https://')) {
            return $avatar;
        }
        return url($avatar);
    }
}
