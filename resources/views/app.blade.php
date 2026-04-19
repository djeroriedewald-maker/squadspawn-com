<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Find your gaming squad, play together, and rate teammates. Build your reputation on the trusted platform for gamers worldwide.">
        <meta name="theme-color" content="#F4F1EC">
        <meta name="keywords" content="gaming, LFG, looking for group, find teammates, gaming squad, esports, multiplayer, reputation, player rating">
        <meta name="robots" content="index, follow">

        <!-- Open Graph / Social -->
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="SquadSpawn">
        <meta property="og:title" content="SquadSpawn - Find, Play, Rate. Build Your Gaming Reputation.">
        <meta property="og:description" content="Create LFG groups, find verified teammates, and rate players after every session. The trusted platform for gamers.">
        <meta property="og:image" content="{{ url('/images/gamer3.jpg') }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="SquadSpawn - Find Your Gaming Squad">
        <meta name="twitter:description" content="Create LFG groups, find verified teammates, and rate players. Build your reputation.">
        <meta name="twitter:image" content="{{ url('/images/gamer3.jpg') }}">

        <!-- Canonical -->
        <link rel="canonical" href="{{ url()->current() }}">

        <title inertia>SquadSpawn</title>

        <!-- PWA -->
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="application-name" content="SquadSpawn">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="SquadSpawn">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">

        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png">
        <link rel="alternate icon" href="/favicon.ico">

        <!-- Structured data -->
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "SquadSpawn",
            "url": "{{ url('/') }}",
            "description": "Find your gaming squad, play together, and rate teammates. Build your reputation on the trusted platform for gamers worldwide.",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "{{ url('/players') }}?q={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        }
        </script>
        <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "SquadSpawn",
            "url": "{{ url('/') }}",
            "logo": "{{ url('/icons/icon-512.png') }}"
        }
        </script>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-bone-50">
        @inertia

        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
            }
        </script>
    </body>
</html>
