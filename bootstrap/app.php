<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\SanitizeInput::class,
            \App\Http\Middleware\CheckMaintenanceMode::class,
            \App\Http\Middleware\EnsureNotBanned::class,
            \App\Http\Middleware\CaptureReferralCode::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\TrackLastActivity::class,
            \App\Http\Middleware\TrackPageView::class,
            // Security headers run last in the web stack so they sit on
            // top of whatever the rest produced. Doesn't change behaviour
            // for our app, just gives securityheaders.com an A+ readout
            // and protects users from clickjacking + downgrade attacks.
            \App\Http\Middleware\SecurityHeaders::class,
        ]);

        $middleware->alias([
            'profile.complete' => \App\Http\Middleware\EnsureProfileComplete::class,
            'age.verified' => \App\Http\Middleware\EnsureAgeVerified::class,
            'admin' => \App\Http\Middleware\EnsureAdmin::class,
            'moderator' => \App\Http\Middleware\EnsureModerator::class,
            'feature' => \App\Http\Middleware\CheckFeatureFlag::class,
        ]);

    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response) {
            if (in_array($response->getStatusCode(), [403, 404, 500, 503])) {
                return Inertia::render('Error', ['status' => $response->getStatusCode()])
                    ->toResponse(request())
                    ->setStatusCode($response->getStatusCode());
            }

            return $response;
        });
    })->create();
