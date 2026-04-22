import { usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

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

    if (!broadcast) return null;

    const close = () => {
        setClosing(true);
        axios.post(route('announcements.dismiss', broadcast.id)).catch(() => {});
        setTimeout(() => setVisible(false), 180);
    };

    const onCtaClick = () => {
        axios.post(route('announcements.clicked', broadcast.id)).catch(() => {});
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
                        {broadcast.sent_at_human && (
                            <span className="text-[11px] text-ink-500">{broadcast.sent_at_human}</span>
                        )}
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
                                    target={broadcast.cta_url.startsWith('http') ? '_blank' : undefined}
                                    rel={broadcast.cta_url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    onClick={onCtaClick}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-4 py-2 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                                >
                                    {broadcast.cta_label}
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
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
