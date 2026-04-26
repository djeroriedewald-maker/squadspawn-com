import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

interface EventDetail {
    id: number;
    slug: string;
    title: string;
    type: string;
    body_html: string | null;
    cover_image: string | null;
    video_url: string | null;
    scheduled_for: string;
    ends_at: string | null;
    timezone: string;
    region: string | null;
    max_capacity: number | null;
    format: 'solo' | 'team';
    external_link: string | null;
    status: string;
    rejected_reason: string | null;
    tier: string;
    registrations_count: number;
    likes_count: number;
    host: { id: number; name: string; profile?: { username?: string; avatar?: string } };
    game?: { id: number; name: string; slug: string; cover_image?: string | null } | null;
}

const STATUS_BADGE: Record<string, { label: string; pill: string }> = {
    pending_review: { label: 'Pending review', pill: 'bg-gaming-orange/15 text-gaming-orange ring-gaming-orange/30' },
    rejected: { label: 'Rejected', pill: 'bg-red-500/15 text-red-500 ring-red-500/30' },
    cancelled: { label: 'Cancelled', pill: 'bg-ink-900/10 text-ink-500 ring-ink-900/15' },
    completed: { label: 'Completed', pill: 'bg-gaming-green/15 text-gaming-green ring-gaming-green/30' },
};

const TYPE_BADGE: Record<string, { label: string; pill: string }> = {
    tournament: { label: 'Tournament', pill: 'bg-neon-red/15 text-neon-red ring-neon-red/30' },
    livestream: { label: 'Watch party', pill: 'bg-gaming-cyan/15 text-gaming-cyan ring-gaming-cyan/30' },
    giveaway: { label: 'Giveaway', pill: 'bg-gaming-orange/15 text-gaming-orange ring-gaming-orange/30' },
    meetup: { label: 'Meetup', pill: 'bg-gaming-green/15 text-gaming-green ring-gaming-green/30' },
    training: { label: 'Training', pill: 'bg-gaming-pink/15 text-gaming-pink ring-gaming-pink/30' },
    other: { label: 'Event', pill: 'bg-ink-900/10 text-ink-700 ring-ink-900/15' },
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        weekday: 'long', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function EventShow({
    event, isRegistered, isLiked, isHost, isAdmin, seo, jsonLd,
}: {
    event: EventDetail;
    isRegistered: boolean;
    isLiked: boolean;
    isHost: boolean;
    isAdmin: boolean;
    seo: { title: string; description: string; image: string; noindex: boolean };
    jsonLd: Record<string, any>;
}) {
    const { auth } = usePage().props as any;
    const isAuthed = !!auth?.user;

    const [liked, setLiked] = useState(isLiked);
    const [likeCount, setLikeCount] = useState(event.likes_count);
    const [shareCopied, setShareCopied] = useState(false);

    const typeBadge = TYPE_BADGE[event.type] ?? TYPE_BADGE.other;
    const statusBadge = STATUS_BADGE[event.status];
    const isFull = event.max_capacity !== null && event.registrations_count >= event.max_capacity;
    const isPast = new Date(event.scheduled_for) < new Date();

    const handleLike = async () => {
        if (!isAuthed) {
            router.visit(route('login'));
            return;
        }
        try {
            const { data } = await axios.post(route('events.like', event.slug));
            setLiked(data.liked);
            setLikeCount(data.count);
        } catch {
            // ignore — server enforces correctness
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        const shareData = { title: event.title, text: seo.description, url };
        if (typeof navigator !== 'undefined' && (navigator as any).share) {
            try { await (navigator as any).share(shareData); return; } catch { /* user cancelled */ }
        }
        try {
            await navigator.clipboard.writeText(url);
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        } catch { /* clipboard blocked */ }
    };

    const handleRegister = () => {
        if (!isAuthed) { router.visit(route('login')); return; }
        router.post(route('events.register', event.slug), {}, { preserveScroll: true });
    };

    const handleUnregister = () => {
        if (!confirm('Remove yourself from this event?')) return;
        router.delete(route('events.unregister', event.slug), { preserveScroll: true });
    };

    const handleCancel = () => {
        if (!confirm('Cancel this event? Attendees will see it as cancelled.')) return;
        router.post(route('events.cancel', event.slug));
    };

    const body = (
        <>
            <Head title={seo.title}>
                <meta name="description" content={seo.description} />
                {seo.noindex && <meta name="robots" content="noindex,nofollow" />}
                <meta property="og:title" content={event.title} />
                <meta property="og:description" content={seo.description} />
                <meta property="og:image" content={seo.image} />
                <meta property="og:type" content="website" />
                <meta property="event:start_time" content={event.scheduled_for} />
                <meta name="twitter:card" content="summary_large_image" />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            </Head>

            {/* ── Status banner (host / admin only) ─────────── */}
            {(isHost || isAdmin) && statusBadge && (
                <div className="border-b border-ink-900/10 bg-bone-100 px-4 py-3 text-center text-sm">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ring-1 ${statusBadge.pill}`}>
                        {statusBadge.label}
                    </span>
                    {event.status === 'pending_review' && (
                        <span className="ml-3 text-ink-500">An admin will review this within 24 hours.</span>
                    )}
                    {event.status === 'rejected' && event.rejected_reason && (
                        <span className="ml-3 text-ink-500">Reason: {event.rejected_reason}</span>
                    )}
                </div>
            )}

            {/* ── Hero ───────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-ink-900/10 bg-ink-900">
                <img
                    src={event.cover_image || '/images/event_banner.jpg'}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-900/90 via-ink-900/70 to-transparent" />
                <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
                    <Link
                        href={route('events.index')}
                        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 transition hover:text-white"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        All events
                    </Link>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest ring-1 ${typeBadge.pill}`}>
                        {typeBadge.label}
                    </span>
                    <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                        {event.title}
                    </h1>
                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
                        <span className="inline-flex items-center gap-2">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                            </svg>
                            {formatDate(event.scheduled_for)}
                        </span>
                        {event.region && <span>· {event.region}</span>}
                        {event.game && (
                            <Link
                                href={route('games.show', event.game.slug)}
                                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white transition hover:border-white/40"
                            >
                                {event.game.cover_image && <img src={event.game.cover_image} alt="" className="h-3 w-5 rounded-sm object-cover" />}
                                {event.game.name}
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Body + sidebar ─────────────────────────────── */}
            <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3 lg:gap-10 lg:px-8">
                <main className="space-y-8 lg:col-span-2">
                    {event.body_html && (
                        <div
                            className="prose prose-lg max-w-none text-ink-700 prose-headings:text-ink-900 prose-a:text-neon-red prose-strong:text-ink-900 prose-img:rounded-xl prose-img:border prose-img:border-ink-900/10 prose-iframe:rounded-xl"
                            dangerouslySetInnerHTML={{ __html: event.body_html }}
                        />
                    )}

                    {event.video_url && !event.body_html?.includes(event.video_url) && (
                        <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-black">
                            <a
                                href={event.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-bone-100 p-4 text-sm font-semibold text-ink-900 transition hover:text-neon-red"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                                Watch on the host's stream
                            </a>
                        </div>
                    )}

                    {/* Like + Share row */}
                    <div className="flex flex-wrap items-center gap-3 border-t border-ink-900/10 pt-6">
                        <button
                            type="button"
                            onClick={handleLike}
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                liked
                                    ? 'border-neon-red bg-neon-red/10 text-neon-red'
                                    : 'border-ink-900/15 bg-white text-ink-700 hover:border-neon-red/30 hover:text-neon-red'
                            }`}
                        >
                            <svg className="h-4 w-4" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                            </svg>
                            {likeCount}
                        </button>
                        <button
                            type="button"
                            onClick={handleShare}
                            className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                            </svg>
                            {shareCopied ? 'Link copied' : 'Share'}
                        </button>
                    </div>
                </main>

                {/* ── Sidebar ────────────────────────────────── */}
                <aside className="space-y-4">
                    <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-ink-500">Joined</p>
                        <p className="mt-1 text-3xl font-extrabold text-ink-900">
                            {event.registrations_count}
                            {event.max_capacity && <span className="text-base font-semibold text-ink-500"> / {event.max_capacity}</span>}
                        </p>
                        {isPast || event.status !== 'published' ? (
                            <p className="mt-3 text-sm text-ink-500">
                                {event.status === 'cancelled' ? 'This event was cancelled.'
                                    : event.status === 'rejected' ? 'This event was not approved.'
                                    : event.status === 'pending_review' ? 'Awaiting admin approval.'
                                    : 'This event has ended.'}
                            </p>
                        ) : isRegistered ? (
                            <button
                                type="button"
                                onClick={handleUnregister}
                                className="mt-4 w-full rounded-lg border border-ink-900/15 bg-bone-100 px-4 py-2.5 text-sm font-bold text-ink-700 transition hover:border-red-500/30 hover:text-red-500"
                            >
                                You're in · cancel?
                            </button>
                        ) : isFull ? (
                            <p className="mt-4 rounded-lg bg-bone-100 px-4 py-2.5 text-center text-sm font-bold text-ink-500">
                                Event is full
                            </p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleRegister}
                                className="mt-4 w-full rounded-lg bg-neon-red px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-neon-red/30 transition hover:bg-neon-red/90"
                            >
                                Join this event
                            </button>
                        )}

                        {event.external_link && event.status === 'published' && (
                            <a
                                href={event.external_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 block w-full rounded-lg border border-ink-900/15 bg-white px-4 py-2.5 text-center text-sm font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                            >
                                Open host's link →
                            </a>
                        )}
                    </div>

                    <div className="rounded-2xl border border-ink-900/10 bg-white p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-ink-500">Hosted by</p>
                        <Link
                            href={route('player.show', event.host.profile?.username || event.host.name)}
                            className="mt-2 flex items-center gap-3"
                        >
                            <img
                                src={event.host.profile?.avatar || '/images/avatars/warrior.svg'}
                                alt=""
                                className="h-10 w-10 rounded-full border border-ink-900/10 object-cover"
                            />
                            <div>
                                <p className="text-sm font-bold text-ink-900">{event.host.profile?.username || event.host.name}</p>
                                <p className="text-xs text-ink-500">View profile</p>
                            </div>
                        </Link>
                    </div>

                    {isHost && event.status !== 'cancelled' && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="block w-full rounded-lg border border-red-500/30 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/5"
                        >
                            Cancel this event
                        </button>
                    )}
                </aside>
            </div>
        </>
    );

    if (isAuthed) return <AuthenticatedLayout>{body}</AuthenticatedLayout>;

    return (
        <div className="min-h-screen bg-bone-50 text-ink-900">
            <nav className="flex items-center justify-between border-b border-ink-900/10 bg-white px-6 py-4 lg:px-12">
                <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                <div className="flex items-center gap-4">
                    <Link href={route('login')} className="text-xs font-semibold text-ink-700 transition hover:text-neon-red">Sign in</Link>
                    <Link href={route('register')} className="rounded-lg bg-neon-red px-3 py-1.5 text-xs font-bold text-white transition hover:bg-neon-red/90">Join free</Link>
                </div>
            </nav>
            {body}
        </div>
    );
}
