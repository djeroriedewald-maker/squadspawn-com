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

        if (!str_starts_with($url, 'https://')) {
            abort(400, 'Invalid URL');
        }

        $parts = parse_url($url);
        if (!is_array($parts) || !isset($parts['host'])) {
            abort(400, 'Invalid URL');
        }

        // Reject URLs with userinfo (`https://trusted.com@evil.com`) — a
        // classic interstitial-bypass trick. parse_url does strip the
        // userinfo from `host` already, but we still refuse the URL so we
        // never display a misleading redirect target to the user.
        if (isset($parts['user']) || isset($parts['pass'])) {
            abort(400, 'Invalid URL');
        }

        $host = strtolower($parts['host']);
        $isTrusted = in_array($host, self::TRUSTED_DOMAINS, true);

        return Inertia::render('Redirect', [
            'url' => $url,
            'host' => $host,
            'isTrusted' => $isTrusted,
        ]);
    }
}
