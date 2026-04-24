<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            // Per-page SEO: controllers may pass a 'seo' prop to override these
            // defaults. Falls back to site-wide values otherwise.
            $seo = $page['props']['seo'] ?? [];
            $seoTitle = $seo['title']
                ?? 'SquadSpawn · LFG Platform to Find Gaming Teammates';
            $seoDescription = $seo['description']
                ?? 'SquadSpawn is the reputation-first LFG platform to find verified gaming teammates for CS2, Valorant, Apex, League of Legends, Fortnite and more. Find your squad across NA, EU and Asia — free forever.';
            $seoKeywords = $seo['keywords']
                ?? 'LFG, LFG platform, find gaming teammates, looking for group, gaming squad finder, find your squad, teammate finder, reputation-based LFG, verified gamers, anti-toxic gaming, CS2 LFG, Valorant LFG, Apex Legends LFG, League of Legends LFG, Fortnite squad finder, Warzone LFG, Overwatch LFG, gaming community, multiplayer matchmaking, Steam-verified teammates, gaming Europe, gaming USA, gaming Asia';
            $seoImageAlt = $seo['image_alt']
                ?? 'SquadSpawn — reputation-first LFG platform for gamers worldwide';
            // Default OG/Twitter card image. Kept at the exact 1200x630
            // Facebook/Reddit/Twitter expect so the preview card crops
            // correctly. Per-page overrides can still pass `seo.image`.
            $seoImage = $seo['image'] ?? url('/images/og-card.jpg');
            $seoType = $seo['type'] ?? 'website';
            $seoNoindex = !empty($seo['noindex']);
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
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5F4EF">
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#14121A">
        <meta name="keywords" content="{{ $seoKeywords }}">
        {{-- max-image-preview:large lets Google show our OG card as a big
             preview in search. max-snippet:-1 lifts the text snippet cap.
             Per-page seo.noindex flips to noindex for auth-only or
             low-value pages. --}}
        <meta name="robots" content="{{ $seoNoindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' }}">
        {{-- Tell phones not to auto-linkify numbers/emails in our copy
             (they already have their own tap targets). --}}
        <meta name="format-detection" content="telephone=no">
        <meta name="author" content="SquadSpawn">

        <!-- Open Graph / Social -->
        <meta property="og:type" content="{{ $seoType }}">
        <meta property="og:site_name" content="SquadSpawn">
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDescription }}">
        <meta property="og:image" content="{{ $seoImage }}">
        <meta property="og:image:alt" content="{{ $seoImageAlt }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:url" content="{{ url()->current() }}">
        {{-- Locale hints for social + search. en_US is primary; listing
             en_GB + en_SG as alternates signals that the same English
             content serves our EU and Asia audiences. --}}
        <meta property="og:locale" content="en_US">
        <meta property="og:locale:alternate" content="en_GB">
        <meta property="og:locale:alternate" content="en_SG">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:site" content="@squadspawnhq">
        <meta name="twitter:creator" content="@squadspawnhq">
        <meta name="twitter:title" content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDescription }}">
        <meta name="twitter:image" content="{{ $seoImage }}">
        <meta name="twitter:image:alt" content="{{ $seoImageAlt }}">

        <!-- Canonical + hreflang -->
        <link rel="canonical" href="{{ url()->current() }}">
        {{-- One English surface today, but hreflang tells search engines
             "same content, any English-speaking region is fine" so we
             rank across NA, EU and Asia equally. x-default catches
             every other region. --}}
        <link rel="alternate" hreflang="en" href="{{ url()->current() }}">
        <link rel="alternate" hreflang="x-default" href="{{ url()->current() }}">

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
        {{-- iOS standalone-launch splash screen. One generic 9:16 image
             covers every modern iPhone; iOS scales and letterboxes as
             needed. Without this iOS shows a white flash on cold start. --}}
        <link rel="apple-touch-startup-image" href="/images/Squadspawn_banner_mobile.jpg">

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
            "alternateName": "SquadSpawn LFG",
            "url": "{{ url('/') }}",
            "description": "Reputation-first LFG platform for gamers in NA, EU and Asia. Find verified teammates across CS2, Valorant, Apex, League of Legends and more.",
            "inLanguage": "en",
            "potentialAction": {
                "@@type": "SearchAction",
                "target": {
                    "@@type": "EntryPoint",
                    "urlTemplate": "{{ url('/players') }}?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
            }
        }
        </script>
        <script type="application/ld+json">
        {
            "@@context": "https://schema.org",
            "@@type": "Organization",
            "name": "SquadSpawn",
            "alternateName": "SquadSpawn LFG",
            "url": "{{ url('/') }}",
            "logo": {
                "@@type": "ImageObject",
                "url": "{{ url('/icons/icon-512.png') }}",
                "width": 512,
                "height": 512
            },
            "image": "{{ url('/images/og-card.jpg') }}",
            "description": "Reputation-first LFG platform to find verified gaming teammates across NA, EU and Asia.",
            "founder": {
                "@@type": "Person",
                "name": "Djero Riedewald"
            },
            "parentOrganization": {
                "@@type": "Organization",
                "name": "BudgetPixels.nl",
                "url": "https://budgetpixels.nl"
            },
            "sameAs": [
                "https://instagram.com/squadspawnhq",
                "https://www.reddit.com/user/Squadspawn/"
            ]
        }
        </script>
        @if ($jsonLd)
        <script type="application/ld+json">{!! json_encode($jsonLd, JSON_UNESCAPED_SLASHES) !!}</script>
        @endif

        <!-- Performance: preconnect + dns-prefetch for the CDNs we pull
             from so the first request isn't blocked on TLS+DNS. Steam
             serves game cover art, RAWG serves game metadata covers. -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link rel="preconnect" href="https://cdn.cloudflare.steamstatic.com" crossorigin>
        <link rel="preconnect" href="https://media.rawg.io" crossorigin>
        <link rel="dns-prefetch" href="https://avatars.steamstatic.com">
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
