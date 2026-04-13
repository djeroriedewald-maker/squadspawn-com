<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="description" content="Find your gaming squad. Match with players by game, rank, and playstyle across Southeast Asia and beyond.">
        <meta name="theme-color" content="#0F172A">

        <!-- Open Graph / Social -->
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="SquadSpawn">
        <meta property="og:title" content="SquadSpawn - Find Your Gaming Squad">
        <meta property="og:description" content="Match with gamers by game, rank, and playstyle. Find your perfect gaming squad.">
        <meta property="og:image" content="{{ url('/images/hero.jpg') }}">
        <meta property="og:url" content="{{ url()->current() }}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="SquadSpawn - Find Your Gaming Squad">
        <meta name="twitter:description" content="Match with gamers by game, rank, and playstyle. Find your perfect gaming squad.">
        <meta name="twitter:image" content="{{ url('/images/hero.jpg') }}">

        <title inertia>{{ config('app.name', 'SquadSpawn') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600,700,800&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-[#06080F]">
        @inertia
    </body>
</html>
