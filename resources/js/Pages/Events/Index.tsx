import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

interface EventCard {
    id: number;
    slug: string;
    title: string;
    type: string;
    cover_image: string | null;
    scheduled_for: string;
    region: string | null;
    tier: string;
    featured_until: string | null;
    max_capacity: number | null;
    registrations_count: number;
    likes_count: number;
    host?: { id: number; name: string; profile?: { username?: string; avatar?: string } };
    game?: { id: number; name: string; slug: string; cover_image?: string | null };
}

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
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function EventsIndex({ events, canHost, seo }: {
    events: EventCard[];
    canHost: boolean;
    seo: { title: string; description: string };
}) {
    const { auth } = usePage().props as any;
    const isAuthed = !!auth?.user;

    const body = (
        <>
            <Head title={seo.title}>
                <meta name="description" content={seo.description} />
                <meta property="og:title" content={seo.title} />
                <meta property="og:description" content={seo.description} />
                <meta property="og:image" content="/images/event_banner.jpg" />
                <meta name="twitter:card" content="summary_large_image" />
            </Head>

            {/* ── Hero ───────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-ink-900/10 bg-ink-900">
                <img
                    src="/images/event_banner.jpg"
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-ink-900/90 via-ink-900/60 to-transparent" />
                <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full border border-neon-red/40 bg-neon-red/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-neon-red">
                        <span className="h-1.5 w-1.5 rounded-full bg-neon-red" />
                        SquadSpawn Events
                    </span>
                    <h1 className="mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                        Tournaments, watch parties, giveaways.
                    </h1>
                    <p className="mt-4 max-w-xl text-lg text-white/80">
                        Real events run by real hosts. Join an upcoming one or pitch your own —
                        every event is reviewed before it goes live so the bar stays high.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        {canHost ? (
                            <Link
                                href={route('events.create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-neon-red px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-neon-red/30 transition hover:bg-neon-red/90"
                            >
                                Host an event
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-2 rounded-lg bg-neon-red px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-neon-red/30 transition hover:bg-neon-red/90"
                            >
                                Sign in to host
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Events grid ───────────────────────────────── */}
            <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                {events.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-12 text-center">
                        <p className="text-lg font-semibold text-ink-900">No events scheduled yet.</p>
                        <p className="mt-2 text-sm text-ink-500">
                            Be the first to host one — tournaments, watch parties or just a meetup with your squad.
                        </p>
                        {canHost && (
                            <Link
                                href={route('events.create')}
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-neon-red px-4 py-2 text-sm font-bold text-white transition hover:bg-neon-red/90"
                            >
                                Host the first event
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {events.map((event) => {
                            const badge = TYPE_BADGE[event.type] ?? TYPE_BADGE.other;
                            const isFeatured = event.tier === 'featured' &&
                                (!event.featured_until || new Date(event.featured_until) >= new Date());
                            return (
                                <Link
                                    key={event.id}
                                    href={route('events.show', event.slug)}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-neon-red/30 hover:shadow-lg"
                                >
                                    {isFeatured && (
                                        <span className="absolute right-3 top-3 z-10 rounded-full bg-neon-red px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white shadow">
                                            Featured
                                        </span>
                                    )}
                                    <div className="relative aspect-[16/9] overflow-hidden bg-bone-100">
                                        <img
                                            src={event.cover_image || '/images/event_banner.jpg'}
                                            alt={event.title}
                                            loading="lazy"
                                            decoding="async"
                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 ${badge.pill}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-1 flex-col gap-2 p-4">
                                        <p className="text-xs font-semibold text-ink-500">
                                            {formatDate(event.scheduled_for)}
                                            {event.region && <> · {event.region}</>}
                                        </p>
                                        <h3 className="text-lg font-bold text-ink-900 transition group-hover:text-neon-red">
                                            {event.title}
                                        </h3>
                                        {event.game && (
                                            <p className="text-xs text-ink-500">{event.game.name}</p>
                                        )}
                                        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-ink-500">
                                            <span>
                                                {event.registrations_count}
                                                {event.max_capacity ? ` / ${event.max_capacity}` : ''} joined
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.625c0-2.485 2.099-4.5 4.688-4.5 1.935 0 3.597 1.126 4.312 2.733.715-1.607 2.377-2.733 4.313-2.733 2.588 0 4.687 2.015 4.687 4.5 0 3.549-2.438 6.734-4.739 8.882a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                                                </svg>
                                                {event.likes_count}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </>
    );

    if (isAuthed) {
        return <AuthenticatedLayout>{body}</AuthenticatedLayout>;
    }

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
