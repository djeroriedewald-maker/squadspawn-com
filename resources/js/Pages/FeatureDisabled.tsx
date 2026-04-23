import { Head, Link, usePage } from '@inertiajs/react';

const COPY: Record<string, { title: string; blurb: string }> = {
    lfg: {
        title: 'LFG is taking a short break',
        blurb: 'The Looking-For-Group feature is temporarily unavailable while we tune things up. Everything else on SquadSpawn keeps working.',
    },
    discovery: {
        title: 'Discovery is paused',
        blurb: 'The swipe-to-match queue is temporarily off. Check back soon, or head to the dashboard in the meantime.',
    },
    community: {
        title: 'Community is paused',
        blurb: 'Community posts are temporarily unavailable. We\'ll have them back up shortly.',
    },
    clips: {
        title: 'Creators is on pause',
        blurb: 'The Creators page and Spotlight are temporarily off. We\'ll be back shortly — your profile and clip submissions are safe.',
    },
    chat: {
        title: 'Chat is briefly offline',
        blurb: 'Direct + group chats are temporarily unavailable. Your messages are safe and waiting.',
    },
    registration: {
        title: 'Sign-ups are temporarily closed',
        blurb: 'We\'re not accepting new accounts right now. Check back soon — or sign in if you already have one.',
    },
};

export default function FeatureDisabled({ feature }: { feature: string }) {
    const { auth } = usePage().props as any;
    const copy = COPY[feature] ?? {
        title: 'Temporarily unavailable',
        blurb: 'This area is offline for a moment. Try again shortly.',
    };

    return (
        <>
            <Head title={copy.title} />

            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
                {/* Background: the portrait SquadSpawn banner covers the full
                    viewport in both orientations. Dark gradient on top keeps
                    text legible regardless of where the image focal point
                    lands, and picks up the brand neon tint. */}
                <img
                    src="/images/Squadspawn_banner_mobile.jpg"
                    alt=""
                    aria-hidden
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-ink-900/90 via-ink-900/80 to-neon-red/30" />
                <div aria-hidden className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-neon-red/25 blur-3xl" />
                <div aria-hidden className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-gaming-cyan/15 blur-3xl" />

                <div className="relative z-10 max-w-lg">
                    <img
                        src="/images/SquadspawnLOGO.png"
                        alt="SquadSpawn"
                        className="mx-auto mb-6 h-20 w-20 rounded-2xl shadow-xl ring-1 ring-ink-900/5"
                    />

                    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-gaming-orange/60 bg-gaming-orange/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gaming-orange backdrop-blur-sm">
                        Temporarily offline
                    </span>

                    <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-4xl">
                        {copy.title}
                    </h1>

                    <p className="mx-auto mt-3 max-w-md text-sm text-white/85 drop-shadow-md sm:text-base">
                        {copy.blurb}
                    </p>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={auth?.user ? route('dashboard') : '/'}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-5 py-2.5 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                        >
                            {auth?.user ? 'Back to dashboard' : 'Back to home'}
                        </Link>
                        {auth?.user && (
                            <Link
                                href={route('help')}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20"
                            >
                                Help centre
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
