<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Site-wide security headers — sets the modern set that
 * securityheaders.com graders look at. Each header is intentional;
 * if you ever need to relax one (e.g. allow embeds), prefer narrowing
 * its value over removing the header.
 *
 * Notes
 * -----
 *  - HSTS is set with `preload` so we can submit squadspawn.com to the
 *    HSTS preload list later. Browsers ignore the preload directive
 *    until you actually submit, so it's safe to include now.
 *  - X-Frame-Options DENY blocks iframing OF squadspawn.com from
 *    anywhere. Embedding YouTube / Twitch INTO our pages (Tiptap) is
 *    unrelated — that's a child iframe, this header is about being a
 *    parent.
 *  - No CSP yet on purpose: Vite + Inertia ship inline-script bootstrap
 *    that needs careful nonce-ing to avoid breaking the app. Add it as
 *    Report-Only first when we tackle it properly.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Skip non-HTML responses where these headers are noise (image,
        // JSON-from-XHR for some headers, etc). HSTS is fine on every
        // response so we leave it on.
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('X-XSS-Protection', '0');
        $response->headers->set('Permissions-Policy', implode(', ', [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
            'interest-cohort=()',
        ]));
        // Cross-Origin-Opener-Policy isolates the browsing context so a
        // popup opened by us can't share state with attacker-controlled
        // tabs. same-origin-allow-popups keeps OAuth popups (Google,
        // Steam) functional.
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

        return $response;
    }
}
