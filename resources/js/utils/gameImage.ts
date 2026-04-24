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

const DIMS: Record<Size, [number, number]> = {
    thumb: [200, 130],   // tiny avatars / drill-down lists
    card: [600, 400],    // grid cards (default)
    hero: [1280, 720],   // game detail page hero
};

const RAWG_PATH = /\/media\/(games|screenshots)\//;

export function gameCoverUrl(
    url: string | null | undefined,
    size: Size = 'card',
): string | null {
    if (!url) return null;
    if (!url.includes('media.rawg.io')) return url;
    // Already resized (path contains /crop/ or /resize/) — leave alone.
    if (url.includes('/media/crop/') || url.includes('/media/resize/')) return url;

    const [w, h] = DIMS[size];
    return url.replace(RAWG_PATH, `/media/crop/${w}/${h}/$1/`);
}
