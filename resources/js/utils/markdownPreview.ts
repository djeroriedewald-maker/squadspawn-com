/**
 * Client-side markdown preview helper. Uses `marked` for parse and
 * `DOMPurify` for sanitization. The server rerenders through league/
 * commonmark for the canonical output, so tiny cosmetic differences
 * between preview and final are possible.
 *
 * We also do a YouTube auto-embed pass here to mirror the server.
 */
import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({
    gfm: true,
    breaks: true,
});

const YOUTUBE_LINK_REGEX =
    /<a [^>]*href="(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})[^"]*"[^>]*>[^<]*<\/a>/gi;

function youtubeEmbed(html: string): string {
    return html.replace(YOUTUBE_LINK_REGEX, (_match, id: string) =>
        `<div class="youtube-embed"><iframe
            src="https://www.youtube.com/embed/${id}"
            title="YouTube video player"
            frameborder="0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe></div>`.replace(/\n\s+/g, ' '),
    );
}

// Allow iframe only for YouTube embed — DOMPurify default strips iframes.
const ALLOWED_IFRAME_HOSTS = ['www.youtube.com', 'youtube.com', 'youtube-nocookie.com'];

DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
        const el = node as Element;
        const src = el.getAttribute?.('src') || '';
        try {
            const url = new URL(src, window.location.origin);
            if (!ALLOWED_IFRAME_HOSTS.includes(url.hostname)) {
                el.remove?.();
            }
        } catch {
            el.remove?.();
        }
    }
});

export function renderMarkdown(src: string): string {
    const raw = marked.parse(src || '', { async: false }) as string;
    const withEmbeds = youtubeEmbed(raw);
    return DOMPurify.sanitize(withEmbeds, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'loading', 'referrerpolicy', 'sandbox', 'title'],
    });
}
