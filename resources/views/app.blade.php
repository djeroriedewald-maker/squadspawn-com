<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            // Per-page SEO: controllers may pass a 'seo' prop to override these
            // defaults. Falls back to site-wide values otherwise.
            $seo = $page['props']['seo'] ?? [];
            $seoTitle = $seo['title'] ?? 'SquadSpawn - Find, Play, Rate. Build Your Gaming Reputation.';
            $seoDescription = $seo['description'] ?? 'Find your gaming squad, play together, and rate teammates. Build your reputation on the trusted platform for gamers worldwide.';
            $seoImage = $seo['image'] ?? url('/images/Squadspawn_banner.jpg');
            $seoType = $seo['type'] ?? 'website';
            $jsonLd = $page['props']['jsonLd'] ?? null;
            $serverTheme = $page['props']['theme']['preference'] ?? 'auto';
        @endphp

        {{-- No-FOUC theme switch. Runs before React mounts so the page renders
             in the correct colour scheme on the very first frame. Server-side
             preference (for authed users) overrides localStorage; anonymous
             users fall back to their stored choice, then system preference. --}}
        <script>
        (function() {
            try {
                var serverPref = @json($serverTheme);
                var stored = null;
                try { stored = localStorage.getItem('theme'); } catch (e) {}
                var pref = (serverPref && serverPref !== 'auto') ? serverPref
                         : (stored && ['auto','light','dark'].indexOf(stored) !== -1 ? stored : serverPref || 'auto');
                var isDark = pref === 'dark' || (pref === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.setAttribute('data-theme', pref);
            } catch (e) {}
        })();
        </script>

        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="{{ $seoDescription }}">
        {{-- Theme colour drives the mobile browser chrome + PWA splash
             background. Dark in both themes so the splash matches the
             SquadSpawn logo's navy backdrop instead of flashing a white
             frame before the app paints. --}}
        <meta name="theme-color" content="#14121A">
        <meta name="keywords" content="gaming, LFG, looking for group, find teammates, gaming squad, esports, multiplayer, reputation, player rating">
        <meta name="robots" content="index, follow">

        <!-- Open Graph / Social -->
        <meta property="og:type" content="{{ $seoType }}">
        <meta property="og:site_name" content="SquadSpawn">
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDescription }}">
        <meta property="og:image" content="{{ $seoImage }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDescription }}">
        <meta name="twitter:image" content="{{ $seoImage }}">

        <!-- Canonical -->
        <link rel="canonical" href="{{ url()->current() }}">

        <title inertia>{{ $seoTitle }}</title>

        <!-- PWA -->
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="application-name" content="SquadSpawn">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        {{-- black-translucent lets the status bar blend into the dark
             background when the PWA launches, so the logo splash fills
             the whole top of the screen on iOS. --}}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="SquadSpawn">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">

        <!-- Favicon -->
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png">
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512.png">
        <link rel="alternate icon" href="/favicon.ico">

        {{-- Structured data. @@ escapes Blade directives so "@@context" outputs "@context". --}}
        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@@type": "WebSite",
            "name": "SquadSpawn",
            "url": "{{ url('/') }}",
            "description": "Find your gaming squad, play together, and rate teammates. Build your reputation on the trusted platform for gamers worldwide.",
            "potentialAction": {
                "@@type": "SearchAction",
                "target": "{{ url('/players') }}?q={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        }
        </script>
        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@@type": "Organization",
            "name": "SquadSpawn",
            "url": "{{ url('/') }}",
            "logo": "{{ url('/icons/icon-512.png') }}"
        }
        </script>
        @if ($jsonLd)
        <script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES) !!}</script>
        @endif

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
