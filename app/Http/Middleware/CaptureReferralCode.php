<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * If a visitor lands with ?ref=CODE, stash the code in the session so we
 * can attribute their eventual signup even if they click around first.
 * Expires with the session.
 */
class CaptureReferralCode
{
    public function handle(Request $request, Closure $next): Response
    {
        $ref = $request->query('ref');
        if (is_string($ref) && $ref !== '' && !$request->session()->has('referral_code')) {
            // Limit to 12 chars, alnum — matches our code format
            if (preg_match('/^[A-Za-z0-9]{4,12}$/', $ref)) {
                $request->session()->put('referral_code', strtoupper($ref));
            }
        }
        return $next($request);
    }
}
