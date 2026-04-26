{!! '<?xml version="1.0" encoding="UTF-8"?>' !!}
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/0.9">
    {{-- Static pages — homepage is the highest-priority entry. --}}
    <url>
        <loc>{{ url('/') }}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
        <image:image>
            <image:loc>{{ url('/images/og-card.jpg') }}</image:loc>
            <image:title>SquadSpawn — LFG platform for gamers</image:title>
        </image:image>
    </url>
    <url>
        <loc>{{ url('/games') }}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>{{ url('/community') }}</loc>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>{{ url('/events') }}</loc>
        <changefreq>daily</changefreq>
        <priority>0.85</priority>
    </url>
    <url>
        <loc>{{ url('/clips') }}</loc>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>{{ url('/changelog') }}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>{{ url('/help') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>{{ url('/contact') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.4</priority>
    </url>
    <url>
        <loc>{{ url('/plus') }}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.5</priority>
    </url>
    <url>
        <loc>{{ url('/privacy-policy') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
    </url>
    <url>
        <loc>{{ url('/terms-of-service') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
    </url>
    <url>
        <loc>{{ url('/cookie-policy') }}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.3</priority>
    </url>

    {{-- Player profiles — each gets its avatar as an image entry so
         Google Image search can surface them for gamertag queries. --}}
    @foreach ($profiles as $profile)
    <url>
        <loc>{{ url('/player/' . $profile->username) }}</loc>
        <lastmod>{{ $profile->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
        @if ($profile->avatar)
        <image:image>
            <image:loc>{{ $profile->avatar }}</image:loc>
            <image:title>{{ $profile->username }}</image:title>
        </image:image>
        @endif
    </url>
    @endforeach

    {{-- Individual game pages — high-value pages for "LFG {game}"
         long-tail queries. Cover image boosts rich-result eligibility. --}}
    @foreach ($games as $game)
    <url>
        <loc>{{ url('/games/' . $game->slug) }}</loc>
        <lastmod>{{ $game->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
        @if ($game->cover_image)
        <image:image>
            <image:loc>{{ $game->cover_image }}</image:loc>
            <image:title>{{ $game->name }} — find teammates on SquadSpawn</image:title>
        </image:image>
        @endif
    </url>
    @endforeach

    {{-- Community posts — user-generated discussion threads; a key
         freshness signal for Google. --}}
    @foreach ($communityPosts as $post)
    <url>
        <loc>{{ url('/community/' . $post->id) }}</loc>
        <lastmod>{{ $post->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.6</priority>
    </url>
    @endforeach

    {{-- Changelog entries — evergreen release notes, low priority but
         include for crawl-freshness + long-tail version queries. --}}
    @foreach ($changelog as $entry)
    <url>
        <loc>{{ url('/changelog/' . $entry->slug) }}</loc>
        <lastmod>{{ ($entry->updated_at ?? $entry->published_at)->toAtomString() }}</lastmod>
        <changefreq>yearly</changefreq>
        <priority>0.4</priority>
    </url>
    @endforeach

    {{-- Upcoming + recent events — schema.org/Event JSON-LD on the show
         page makes these eligible for rich-result event cards in Google. --}}
    @foreach ($events as $event)
    <url>
        <loc>{{ url('/events/' . $event->slug) }}</loc>
        <lastmod>{{ $event->updated_at->toAtomString() }}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
    </url>
    @endforeach
</urlset>
