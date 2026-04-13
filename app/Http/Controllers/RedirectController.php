<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class RedirectController extends Controller
{
    private const TRUSTED_DOMAINS = [
        'instagram.com', 'www.instagram.com',
        'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
        'tiktok.com', 'www.tiktok.com',
        'youtube.com', 'www.youtube.com', 'youtu.be',
        'twitch.tv', 'www.twitch.tv', 'clips.twitch.tv',
        'facebook.com', 'www.facebook.com',
        'discord.gg', 'discord.com',
        'steamcommunity.com', 'store.steampowered.com',
        'reddit.com', 'www.reddit.com',
        'github.com',
    ];

    public function redirect(): Response
    {
        $url = request()->input('url', '');

        // Only allow https URLs
        if (!str_starts_with($url, 'https://')) {
            abort(400, 'Invalid URL');
        }

        $host = parse_url($url, PHP_URL_HOST);
        $isTrusted = in_array($host, self::TRUSTED_DOMAINS);

        return Inertia::render('Redirect', [
            'url' => $url,
            'host' => $host,
            'isTrusted' => $isTrusted,
        ]);
    }
}
