/**
 * Rewrite RAWG cover URLs to a smaller variant served by the same CDN.
 *
 * RAWG stores `background_image` as a full-size URL like
 *   https://media.rawg.io/media/games/abc/abc123.jpg          (~1280×720+, 200–500KB)
 *
 * Their CDN supports on-the-fly cropping at:
 *   https://media.rawg.io/media/crop/W/H/games/abc/abc123.jpg (resized, 30–80KB)
 *
 * Loading the full-size image into a 300×200 card wastes 5–10× the bandwidth.
 * This helper rewrites the path; non-RAWG URLs (Steam, local /images/games/,
 * absolute fallbacks) are returned unchanged so callers can use it blindly.
 */

type Size = 'thumb' | 'card' | 'hero';

// RAWG's CDN only honours a fixed allow-list of crop dimensions; any other
// W/H combo 307-redirects to a 404 page. 600/400 and 1280/720 are the two
// presets confirmed working in the wild — 200/130 (the previous thumb) was
// silently broken on every image. Sticking to 600/400 for thumb means a
// few extra KB per image but actually loads.
const DIMS: Record<Size, [number, number]> = {
    thumb: [600, 400],   // tiny avatars / drill-down lists
    card: [600, 400],    // grid cards (default)
    hero: [1280, 720],   // game detail page hero
};

const RAWG_PATH = /\/media\/(games|screenshots)\//;

export function gameCoverUrl(
    url: string | null | undefined,
    size: Size = 'card',
): string | null {
    if (!url) return null;
    // RAWG returns `api.rawg.io/media/...` for some games and
    // `media.rawg.io/media/...` for others, but only the media
    // subdomain serves the /crop/ resize endpoint — api.rawg.io 404s.
    let normalized = url.replace('://api.rawg.io/media/', '://media.rawg.io/media/');
    if (!normalized.includes('media.rawg.io')) return normalized;
    if (normalized.includes('/media/crop/') || normalized.includes('/media/resize/')) return normalized;

    const [w, h] = DIMS[size];
    return normalized.replace(RAWG_PATH, `/media/crop/${w}/${h}/$1/`);
}
