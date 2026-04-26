<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Homepage rotation
    |--------------------------------------------------------------------------
    |
    | Slugs of games to show in the scrolling banner on /, in priority order.
    | The query in routes/web.php takes these first (in this exact order),
    | then tops up to 25 with whatever else has a cover image, ordered by
    | popularity_score. Curated by hand because RAWG's free tier caps at
    | 20k req/month and our launch regions (PH/ID/MY) skew mobile-MOBA in a
    | way that RAWG's PC-leaning popularity score doesn't capture.
    |
    | All slugs below are guaranteed by GameSeeder so the strip never
    | falls back to placeholders even on a fresh install.
    |
    */

    'homepage_rotation' => [
        'mobile-legends-bang-bang',
        'counter-strike-2',
        'valorant',
        'league-of-legends',
        'fortnite',
        'apex-legends',
        'dota-2',
        'overwatch-2',
        'genshin-impact',
        'free-fire',
        'pubg-mobile',
        'call-of-duty-mobile',
        'rocket-league',
        'minecraft',
        'honor-of-kings',
        'arena-of-valor',
        'brawl-stars',
        'clash-royale',
        'stumble-guys',
    ],

];
