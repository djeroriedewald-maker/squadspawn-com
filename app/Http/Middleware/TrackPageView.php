<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Native, privacy-friendly pageview tracker.
 *
 * Logs one row to the page_views table per tracked GET request. We
 * hash IP + user-agent with the app key so distinct-visitor counts
 * are possible without storing identifiable data. Admin pages,
 * health checks, API / JSON responses, and obvious bots are all
 * filtered out at the top so they never touch the DB.
 *
 * The write happens AFTER the response has been built, so if the
 * insert fails or takes a moment, the user has already received
 * their HTML.
 */
class TrackPageView
{
    /** UA substrings that indicate a bot / crawler we don't want to count. */
    private const BOT_SUBSTRINGS = [
        'bot', 'crawl', 'spider', 'slurp', 'preview', 'facebookexternalhit',
        'discordbot', 'slackbot', 'twitterbot', 'telegrambot', 'linkedinbot',
        'pingdom', 'uptimerobot', 'betterstack', 'monitis',
        'headless', 'phantomjs', 'lighthouse', 'pagespeed',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($this->shouldTrack($request, $response)) {
            $this->record($request);
        }

        return $response;
    }

    private function shouldTrack(Request $request, Response $response): bool
    {
        if (!$request->isMethod('GET')) return false;
        if ($response->getStatusCode() !== 200) return false;
        if ($request->wantsJson()) return false;

        $path = trim($request->path(), '/');
        if ($path === 'up') return false;
        if (str_starts_with($path, 'admin')) return false;
        if (str_starts_with($path, 'api/')) return false;
        if (str_starts_with($path, 'storage/')) return false;
        if (str_starts_with($path, 'build/')) return false;
        // Inertia partial-reload requests — they're not a new pageview
        // from the user's perspective, just a data refresh.
        if ($request->header('X-Inertia-Partial-Data')) return false;

        $ua = (string) $request->header('User-Agent', '');
        if ($ua === '' || $this->looksLikeBot($ua)) return false;

        return true;
    }

    private function looksLikeBot(string $ua): bool
    {
        $ua = strtolower($ua);
        foreach (self::BOT_SUBSTRINGS as $needle) {
            if (str_contains($ua, $needle)) return true;
        }
        return false;
    }

    private function record(Request $request): void
    {
        try {
            DB::table('page_views')->insert([
                'path' => $this->normalizePath($request->path()),
                'day' => now()->toDateString(),
                'visitor_hash' => $this->visitorHash($request),
                'created_at' => now(),
            ]);
        } catch (\Throwable) {
            // Analytics is best-effort. Never break the user's request
            // for a failed tracker insert.
        }
    }

    /**
     * Fold high-cardinality IDs into bucket labels so top-pages remain
     * meaningful (e.g. /lfg/my-session becomes /lfg/:slug).
     */
    private function normalizePath(string $path): string
    {
        $path = '/' . ltrim($path, '/');
        // Numeric IDs
        $path = (string) preg_replace('#/\d+(/|$)#', '/:id$1', $path);
        // UUIDs
        $path = (string) preg_replace(
            '#/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(/|$)#i',
            '/:uuid$1',
            $path,
        );
        // Slug-like segments after /lfg/ /community/ /player/ get bucketed
        $path = (string) preg_replace('#^/lfg/(?!$)[^/]+#', '/lfg/:slug', $path);
        $path = (string) preg_replace('#^/community/(?!(create|team|guidelines)$)[^/]+#', '/community/:slug', $path);
        $path = (string) preg_replace('#^/player/(?!$)[^/]+#', '/player/:username', $path);
        return substr($path, 0, 255);
    }

    private function visitorHash(Request $request): string
    {
        $ip = (string) $request->ip();
        $ua = (string) $request->header('User-Agent', '');
        $salt = (string) config('app.key');
        return hash('sha256', $ip . '|' . $ua . '|' . $salt);
    }
}
