import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Props {
    prefillEmail: string;
    alreadyJoined: boolean;
    memberCount: number;
}

const TEASERS = [
    {
        icon: '📊',
        title: 'Profile analytics',
        body: 'See who viewed your profile, which of your games are trending in your region, and how your reputation is evolving week over week.',
    },
    {
        icon: '✨',
        title: 'Verified badge',
        body: 'A small badge on your profile + in LFG listings. Optional, not flashy — just a signal that you\'re serious about playing.',
    },
    {
        icon: '🎯',
        title: 'Priority in Discover',
        body: 'Your profile surfaces higher in match suggestions for players who share your games + region. Same fair-scoring algorithm, small priority nudge.',
    },
    {
        icon: '🕵️',
        title: 'Ghost mode',
        body: 'Hide yourself from Discovery swipe feed while keeping your friend list + LFGs active. Drop in silently when you want to play with people you already know.',
    },
    {
        icon: '🎨',
        title: 'Profile customisation',
        body: 'Animated banners, extra preset colour themes, richer bio formatting, custom achievement display-case layouts.',
    },
    {
        icon: '💬',
        title: 'Power-user extras',
        body: 'Longer chat history, advanced discovery filters (min reputation, mic-only, timezone overlap), bigger squad sizes in LFG.',
    },
];

export default function PlusWaitlist({ prefillEmail, alreadyJoined, memberCount }: Props) {
    const flash = (usePage().props as { flash?: { message?: string } }).flash;
    const [submitted, setSubmitted] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<{ email: string; note: string; website: string }>({
        email: prefillEmail,
        note: '',
        website: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('plus.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitted(true);
                reset('note');
            },
        });
    };

    const alreadyOnList = alreadyJoined || submitted;

    return (
        <>
            <Head title="SquadSpawn Plus — Join the waitlist" />

            <div className="min-h-screen bg-bone-50 text-ink-900">
                {/* Hero with full-bleed VIP-pod backdrop. The image sits
                    underneath a vertical dark gradient that lets the photo
                    breathe at the top but fades into the page bg at the
                    bottom — no hard cut between hero and the form area
                    below. Text uses a stroke-style shadow (hard outline +
                    soft halo) so it stays crisp over busy red neon. */}
                <section className="relative overflow-hidden bg-ink-900">
                    <img
                        src="/images/waitlist_banner.jpg"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/65 to-bone-50" />

                    <nav className="relative flex items-center justify-between px-6 py-4 lg:px-12">
                        <Link href="/" className="text-2xl font-bold text-white transition hover:text-neon-red [text-shadow:_0_0_4px_rgba(0,0,0,0.9)]">SquadSpawn</Link>
                        <Link href="/" className="text-sm font-semibold text-white transition hover:text-neon-red [text-shadow:_0_0_4px_rgba(0,0,0,0.9)]">← Back</Link>
                    </nav>

                    <div className="relative mx-auto max-w-3xl px-6 pb-32 pt-16 text-center lg:px-12">
                        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-neon-red px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow-lg ring-1 ring-white/10">
                            ✨ Coming when you're ready
                        </span>
                        <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl [text-shadow:_0_0_3px_rgba(0,0,0,1),_0_3px_18px_rgba(0,0,0,0.9)]">
                            SquadSpawn <span className="text-neon-red [text-shadow:_0_0_3px_rgba(0,0,0,1),_0_3px_18px_rgba(0,0,0,0.95)]">Plus</span>
                        </h1>
                        <p className="mx-auto mt-5 max-w-xl text-base font-medium text-white sm:text-lg [text-shadow:_0_0_2px_rgba(0,0,0,1),_0_2px_12px_rgba(0,0,0,0.9)]">
                            A premium tier for players who want more out of their reputation, discovery, and profile. We're not building it yet — this waitlist tells us which features you'd actually pay for.
                        </p>
                        {memberCount > 0 && (
                            <p className="mt-5 inline-flex rounded-full bg-ink-900/80 px-3 py-1 text-xs font-semibold text-white shadow-md ring-1 ring-white/10 backdrop-blur-sm">
                                <strong className="text-white">{memberCount.toLocaleString()}</strong>&nbsp;{memberCount === 1 ? 'gamer is' : 'gamers are'} already on the list
                            </p>
                        )}
                    </div>
                </section>

                <div className="mx-auto max-w-3xl px-6 py-12 lg:px-12">
                    {/* Waitlist card */}
                    <div className="mb-10 rounded-2xl border border-neon-red/20 bg-white p-6 shadow-lg shadow-neon-red/5 sm:p-8">
                        {alreadyOnList ? (
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gaming-green/10 text-2xl">
                                    ✓
                                </div>
                                <h2 className="text-xl font-bold text-ink-900">You're on the list</h2>
                                <p className="mt-2 text-sm text-ink-500">
                                    {flash?.message ?? "We'll email you when Plus goes live. No spam, no early-access scams — just a single heads-up when it's real."}
                                </p>
                                <Link
                                    href="/"
                                    className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neon-red/90"
                                >
                                    Back to SquadSpawn
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink-900">
                                        Your email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        placeholder="you@example.com"
                                        className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                    />
                                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                </div>

                                <div>
                                    <label htmlFor="note" className="mb-1 block text-sm font-semibold text-ink-900">
                                        What would you pay for? <span className="text-xs font-normal text-ink-500">(optional)</span>
                                    </label>
                                    <textarea
                                        id="note"
                                        value={data.note}
                                        onChange={(e) => setData('note', e.target.value)}
                                        placeholder="Priority matching, profile analytics, bigger squad sizes, something else we haven't thought of..."
                                        rows={3}
                                        maxLength={1000}
                                        className="w-full resize-none rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                    />
                                    {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
                                    <p className="mt-1 text-[11px] text-ink-500">
                                        Honest feedback helps us build the right thing — your answer goes straight to Djero, not to a marketing list.
                                    </p>
                                </div>

                                {/* Honeypot — hidden from humans, bots often fill every input */}
                                <div className="hidden" aria-hidden>
                                    <label>
                                        Website
                                        <input
                                            type="text"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={data.website}
                                            onChange={(e) => setData('website', e.target.value)}
                                        />
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-neon-red px-5 py-3 text-sm font-bold text-white shadow-lg shadow-neon-red/25 transition hover:bg-neon-red/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? 'Adding you to the list…' : 'Join the waitlist'}
                                </button>
                                <p className="text-center text-[11px] text-ink-500">
                                    We only use your email for this one notification. You can ask us to remove it at any time.
                                </p>
                            </form>
                        )}
                    </div>

                    {/* Teaser features */}
                    <div className="mb-10">
                        <h2 className="mb-4 text-center text-lg font-bold uppercase tracking-wide text-ink-900">What we're exploring</h2>
                        <p className="mx-auto mb-6 max-w-xl text-center text-sm text-ink-500">
                            A starter list — not a roadmap. Tell us in the form above which of these you want first, or what's missing.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {TEASERS.map((t) => (
                                <div key={t.title} className="rounded-xl border border-ink-900/10 bg-white p-5">
                                    <span className="text-2xl">{t.icon}</span>
                                    <h3 className="mt-2 font-bold text-ink-900">{t.title}</h3>
                                    <p className="mt-1 text-sm text-ink-500">{t.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6 sm:p-8">
                        <h2 className="mb-4 text-lg font-bold text-ink-900">Honest questions, honest answers</h2>
                        <dl className="space-y-4 text-sm">
                            <div>
                                <dt className="font-bold text-ink-900">When will this launch?</dt>
                                <dd className="mt-1 text-ink-500">
                                    When enough of you ask for it. Likely around 500-1000 active members — probably mid-to-late 2026. No sooner, so the core experience stays sharp first.
                                </dd>
                            </div>
                            <div>
                                <dt className="font-bold text-ink-900">What will it cost?</dt>
                                <dd className="mt-1 text-ink-500">
                                    Aiming for something around €4-5/month. Monthly, cancellable any time. Annual discount likely. Founding-waitlist members probably get the first month free and a permanent discount.
                                </dd>
                            </div>
                            <div>
                                <dt className="font-bold text-ink-900">Will SquadSpawn stay free without Plus?</dt>
                                <dd className="mt-1 text-ink-500">
                                    Yes. Matchmaking, LFG, chat, Discover, community — all the core features stay free forever. Plus is additive, not a paywall on what works today.
                                </dd>
                            </div>
                            <div>
                                <dt className="font-bold text-ink-900">Ads or data-selling?</dt>
                                <dd className="mt-1 text-ink-500">
                                    Never. Plus exists exactly so we don't have to go that route.
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <p className="mt-8 text-center text-xs text-ink-500">
                        Questions? Use our{' '}
                        <Link href="/contact" className="text-neon-red hover:underline">contact form</Link>.
                    </p>
                </div>
            </div>
        </>
    );
}
