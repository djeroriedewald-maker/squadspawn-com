import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

/**
 * Fire a POST that's allowed to outlive the current page. Uses
 * navigator.sendBeacon when available (most browsers) and falls back
 * to `fetch` with `keepalive: true`. The CSRF token rides in the URL
 * via a query arg because Beacon can't set custom headers.
 */
function sendBeaconPost(url: string): void {
    const xsrfMatch = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    const token = xsrfMatch ? decodeURIComponent(xsrfMatch[1]) : null;
    const blob = new Blob([''], { type: 'application/x-www-form-urlencoded' });
    const target = token ? `${url}${url.includes('?') ? '&' : '?'}_token=${encodeURIComponent(token)}` : url;

    if (navigator.sendBeacon?.(target, blob)) return;

    // Fallback: fetch with keepalive so the browser keeps the request
    // in-flight even after page unload.
    fetch(target, {
        method: 'POST',
        credentials: 'same-origin',
        keepalive: true,
        headers: token ? { 'X-XSRF-TOKEN': token } : undefined,
    }).catch(() => {});
}

interface ActiveBroadcast {
    id: number;
    title: string;
    body_html?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    image_url?: string | null;
    youtube_id?: string | null;
    sent_at_human?: string | null;
}

/**
 * Full-screen announcement popup. Rendered once in AuthenticatedLayout
 * — the shared `activeBroadcast` prop comes straight from Inertia and
 * reflects the first undismissed popup for the viewer.
 *
 * Interactions:
 *   - On mount → POST /announcements/{id}/viewed so analytics tick.
 *   - Dismiss → POST /announcements/{id}/dismiss, close with animation.
 *   - CTA click → POST /announcements/{id}/clicked, then navigate.
 */
export default function BroadcastPopup() {
    const { activeBroadcast } = usePage().props as any;
    const broadcast: ActiveBroadcast | null = activeBroadcast ?? null;

    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        if (!broadcast) return;
        // Delay one tick so the enter-transition runs.
        const t = setTimeout(() => setVisible(true), 30);
        axios.post(route('announcements.viewed', broadcast.id)).catch(() => {});
        // Lock background scroll while the popup is open.
        document.body.style.overflow = 'hidden';
        return () => {
            clearTimeout(t);
            document.body.style.overflow = '';
        };
    }, [broadcast?.id]);

    // Inertia only re-runs shared-prop resolvers on full page visits, so a
    // broadcast that gets sent while the user is sitting idle on one tab
    // never shows up until they navigate. Do a partial reload of just the
    // `activeBroadcast` prop on an interval + when the tab regains focus.
    useEffect(() => {
        const refresh = () => {
            router.reload({ only: ['activeBroadcast'] });
        };
        const id = window.setInterval(refresh, 60_000);
        const onFocus = () => {
            if (document.visibilityState === 'visible') refresh();
        };
        document.addEventListener('visibilitychange', onFocus);
        return () => {
            window.clearInterval(id);
            document.removeEventListener('visibilitychange', onFocus);
        };
    }, []);

    if (!broadcast) return null;

    // A CTA pointing at our own origin should navigate inside the PWA —
    // not punt the user out into a Chrome Custom Tab (which is what
    // target="_blank" does from an installed PWA on Android).
    const ctaIsExternal = (() => {
        if (!broadcast.cta_url) return false;
        try {
            return new URL(broadcast.cta_url, window.location.href).origin !== window.location.origin;
        } catch {
            return false;
        }
    })();

    const close = () => {
        setClosing(true);
        axios.post(route('announcements.dismiss', broadcast.id)).catch(() => {});
        setTimeout(() => {
            setVisible(false);
            // Re-fetch activeBroadcast: if another undismissed one is
            // queued behind this one, it takes over the popup slot.
            router.reload({ only: ['activeBroadcast'] });
        }, 180);
    };

    const onCtaClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Take manual control of the navigation so we can guarantee the
        // clicked+dismiss POST completes *before* the browser leaves.
        // sendBeacon strips headers, so Laravel's CSRF middleware would
        // reject it and the popup would come back on the next page load.
        // Preventing default + awaiting axios is the one approach that
        // works everywhere without loosening security.
        e.preventDefault();
        const href = broadcast.cta_url!;
        try {
            await axios.post(route('announcements.clicked', broadcast.id));
        } catch {
            // Network error — still navigate, the user clearly wants to go.
        }
        if (ctaIsExternal) {
            window.open(href, '_blank', 'noopener,noreferrer');
        } else {
            window.location.href = href;
        }
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`broadcast-${broadcast.id}-title`}
            className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-150 ${
                visible && !closing ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ pointerEvents: visible && !closing ? 'auto' : 'none' }}
        >
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Dismiss"
                onClick={close}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Card */}
            <div
                className={`relative w-full max-w-xl overflow-hidden rounded-3xl bg-white text-ink-900 shadow-2xl ring-1 ring-white/10 transition-all duration-200 ${
                    visible && !closing ? 'translate-y-0 scale-100' : 'translate-y-6 scale-95'
                }`}
            >
                {/* Decorative glow */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-neon-red/30 blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-gaming-cyan/20 blur-3xl"
                />

                {/* Close button */}
                <button
                    type="button"
                    onClick={close}
                    aria-label="Close announcement"
                    className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-ink-900 backdrop-blur-sm transition hover:bg-black/20"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Media — image OR YouTube embed, never both */}
                {broadcast.image_url && !broadcast.youtube_id && (
                    <img src={broadcast.image_url} alt="" className="h-48 w-full object-cover sm:h-56" />
                )}
                {broadcast.youtube_id && (
                    <div className="relative aspect-video w-full bg-black">
                        <iframe
                            className="absolute inset-0 h-full w-full"
                            src={`https://www.youtube.com/embed/${broadcast.youtube_id}`}
                            title={broadcast.title}
                            frameBorder={0}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                )}

                <div className="relative p-6 sm:p-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-neon-red/30 bg-neon-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-neon-red">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-red" />
                        Announcement
                    </span>
                    <h2
                        id={`broadcast-${broadcast.id}-title`}
                        className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl"
                    >
                        {broadcast.title}
                    </h2>

                    {broadcast.body_html && (
                        <div
                            className="prose prose-sm mt-4 max-w-none text-ink-700"
                            dangerouslySetInnerHTML={{ __html: broadcast.body_html }}
                        />
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5 text-[11px] text-ink-500">
                            {broadcast.sent_at_human && <span>{broadcast.sent_at_human}</span>}
                            <a
                                href={route('announcements.index')}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                        await axios.post(route('announcements.dismiss', broadcast.id));
                                    } catch {}
                                    window.location.href = route('announcements.index');
                                }}
                                className="inline-flex items-center gap-1 font-semibold text-ink-700 hover:text-neon-red"
                            >
                                See all announcements →
                            </a>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={close}
                                className="rounded-xl border border-ink-900/10 bg-bone-100 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                            >
                                Got it
                            </button>
                            {broadcast.cta_url && broadcast.cta_label && (
                                <a
                                    href={broadcast.cta_url}
                                    target={ctaIsExternal ? '_blank' : undefined}
                                    rel={ctaIsExternal ? 'noopener noreferrer' : undefined}
                                    onClick={onCtaClick}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-4 py-2 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                                >
                                    {broadcast.cta_label}
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d={ctaIsExternal ? "M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" : "M13 7l5 5-5 5M6 12h12"} />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
