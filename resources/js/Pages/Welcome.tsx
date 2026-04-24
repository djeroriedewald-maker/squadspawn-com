import CreatorSpotlight, { FeaturedCreator } from '@/Components/CreatorSpotlight';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link, usePage } from '@inertiajs/react';
import { Game } from '@/types';
import { gameCoverUrl } from '@/utils/gameImage';

interface GameWithCount extends Game {
    users_count: number;
}

interface WelcomeProps {
    canLogin: boolean;
    canRegister: boolean;
    totalPlayers: number;
    totalGames: number;
    activeLfg: number;
    topGames: GameWithCount[];
    recentPlayers: { id: number; username: string; avatar?: string; created_at: string }[];
    onlineNow: number;
    featuredCreators: FeaturedCreator[];
}

const onCoverError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.dataset.fallback) {
        img.dataset.fallback = '1';
        img.src = '/icons/icon-512.png';
        img.classList.add('opacity-30');
    }
};

export default function Welcome({
    canLogin,
    canRegister,
    totalPlayers,
    totalGames,
    activeLfg,
    topGames,
    recentPlayers,
    onlineNow,
    featuredCreators,
}: WelcomeProps) {
    const user = usePage().props.auth?.user;

    const FOUNDER_CAP = 500;
    const isFounderPhase = totalPlayers < FOUNDER_CAP;
    const founderNumber = totalPlayers + 1;
    const founderSpotsLeft = Math.max(FOUNDER_CAP - totalPlayers, 0);

    // Thresholds below which raw counts are *negative* social proof —
    // "3 members" reads as dead, not early. Under these thresholds we
    // switch from crowd-framing ("N gamers online") to scarcity-framing
    // ("Early access · Founder phase"). Flips over automatically as
    // the platform grows, no manual milestones to chase.
    const SHOW_PLAYER_COUNT = totalPlayers >= 100;
    const SHOW_ONLINE_COUNT = onlineNow >= 20;
    const SHOW_LFG_COUNT = activeLfg >= 10;
    const SHOW_SOCIAL_PROOF_STRIP = totalPlayers >= 100;
    // Founder-phase counts cut both ways: "Be #103 of 500" is great
    // momentum-framing, but "Be #3 of 500" (and its mirror "497 spots
    // left") gives away the empty lobby. Only show the raw position /
    // remaining-spots numbers once we've filled at least 50 of 500 —
    // before that, lean on generic "Founder phase · Early access" copy.
    const SHOW_FOUNDER_COUNTS = totalPlayers >= 50;

    return (
        <>
            {/* Head tags come from the server via the seo + jsonLd props
                in routes/web.php — single source of truth, keyword-rich
                title + description + SoftwareApplication + FAQPage JSON-LD. */}

            <div className="min-h-screen bg-bone-50 text-ink-900">
                {/* ── Nav ─────────────────────────────────────────── */}
                <nav className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-12">
                    <Link href="/" className="flex items-center gap-2" aria-label="SquadSpawn home">
                        <img src="/images/SquadspawnLOGO.png" alt="SquadSpawn" className="h-10 w-10 rounded-lg object-cover shadow-md ring-1 ring-white/10 sm:h-11 sm:w-11" />
                        <span className="text-xl font-bold text-neon-red sm:text-2xl">SquadSpawn</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <ThemeToggle compact />
                        {user ? (
                            <Link href={route('dashboard')} className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/80">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                {canLogin && <Link href={route('login')} className="text-sm font-medium text-ink-700 hover:text-ink-900">Log in</Link>}
                                {canRegister && <Link href={route('register')} className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/80">Sign up</Link>}
                            </>
                        )}
                    </div>
                </nav>

                {/* ── Hero ────────────────────────────────────────── */}
                <section className="relative overflow-hidden">
                    <div className="absolute inset-0">
                        {/* Responsive art direction: portrait for phones,
                            landscape from tablet up. Both are text-free
                            so the hero copy owns the wordmark duty. */}
                        <picture>
                            <source media="(max-width: 639px)" srcSet="/images/Squadspawn_banner_mobile.jpg" />
                            <img src="/images/Squadspawn_banner_2.jpg" alt="" className="h-full w-full object-cover" loading="eager" />
                        </picture>
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-bone-50" />
                        <div className="absolute inset-0 bg-grid opacity-20" />
                    </div>

                    <div className="relative mx-auto max-w-6xl px-6 py-20 lg:px-12 lg:py-32">
                        <div className="max-w-3xl">
                            {/* Brand mark front and centre — sets the tone
                                before the user reads a word. */}
                            <img
                                src="/images/SquadspawnLOGO.png"
                                alt="SquadSpawn"
                                className="mb-6 h-24 w-24 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 sm:h-28 sm:w-28"
                                loading="eager"
                            />
                            {isFounderPhase && (
                                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-neon-red/40 bg-black/40 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-neon-red backdrop-blur-sm">
                                    <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-red opacity-75" />
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-red" />
                                    </span>
                                    {SHOW_FOUNDER_COUNTS
                                        ? <>Founder phase · {founderSpotsLeft} spots left</>
                                        : <>Founder phase · Early access</>}
                                </div>
                            )}

                            <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-7xl">
                                Find your <span className="text-neon-red">squad</span>.
                                <br />
                                Not randoms.
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
                                The LFG where teammates actually show up. Real Steam stats, ratings you can trust, zero patience for toxic randoms. Play with people who want to play <em>with</em> you — not through you.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                {canRegister && (
                                    <Link href={route('register')} className="group inline-flex items-center gap-2 rounded-xl bg-neon-red px-6 py-3 text-base font-bold text-white shadow-glow-red transition hover:bg-neon-red/90">
                                        {isFounderPhase ? 'Claim founder spot' : 'Sign up free'}
                                        <svg className="h-5 w-5 transition group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                        </svg>
                                    </Link>
                                )}
                                <a href="#how" className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-black/30 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-black/50">
                                    How it works
                                </a>
                            </div>

                            {/* Live stats chips — each is gated individually.
                                Below threshold we'd rather show nothing than
                                show a number that reads as "dead platform". */}
                            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
                                {SHOW_ONLINE_COUNT && (
                                    <span className="flex items-center gap-2">
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-gaming-green" />
                                        <strong className="text-gaming-green">{onlineNow.toLocaleString()}</strong> online now
                                    </span>
                                )}
                                {SHOW_PLAYER_COUNT && (
                                    <span><strong className="text-white">{totalPlayers.toLocaleString()}</strong> gamers</span>
                                )}
                                <span><strong className="text-white">{totalGames.toLocaleString()}</strong> games</span>
                                {SHOW_LFG_COUNT && (
                                    <span><strong className="text-white">{activeLfg.toLocaleString()}</strong> active LFGs</span>
                                )}
                                {/* Fallback chip so the row doesn't feel empty
                                    while counts are still ramping. */}
                                {!SHOW_PLAYER_COUNT && (
                                    <span className="flex items-center gap-2 rounded-full border border-neon-red/30 bg-neon-red/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-neon-red">
                                        <span className="h-1.5 w-1.5 rounded-full bg-neon-red" />
                                        Early access · Free forever
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Scrolling game banner ───────────────────────── */}
                {topGames.length > 0 && (
                    <div className="relative overflow-hidden border-y border-ink-900/10 bg-bone-100/60 py-4">
                        <div className="animate-scroll flex gap-4">
                            {[...topGames, ...topGames, ...topGames].map((game, i) => (
                                <img
                                    key={i}
                                    src={gameCoverUrl(game.cover_image, 'thumb') || `/images/games/${game.slug}.svg`}
                                    alt={game.name}
                                    loading="lazy"
                                    decoding="async"
                                    onError={onCoverError}
                                    className="h-16 w-28 flex-shrink-0 rounded-lg object-cover opacity-70 transition hover:opacity-100 sm:h-20 sm:w-36"
                                />
                            ))}
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bone-50 to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bone-50 to-transparent" />
                    </div>
                )}

                {/* ── Billboard: Before vs After ──────────────────── */}
                {/* bg hardcoded to stay dark in both themes — the tile
                    image and white copy are designed for a dark frame.
                    (ink-900 token flips to near-white in dark mode.) */}
                <section className="relative overflow-hidden bg-[#14121A]">
                    <div className="mx-auto grid max-w-6xl items-center gap-8 px-6 py-14 lg:grid-cols-5 lg:gap-12 lg:px-12 lg:py-20">
                        <div className="lg:col-span-3">
                            <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-2xl">
                                <img
                                    src="/images/before-and-after.jpg"
                                    alt="Before vs after SquadSpawn — solo versus playing with your squad"
                                    className="w-full"
                                    loading="lazy"
                                />
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Before vs after</p>
                            <h2 className="mt-2 text-3xl font-black leading-tight text-white sm:text-4xl">
                                Stop playing alone <span className="whitespace-nowrap">with strangers.</span>
                            </h2>
                            <p className="mt-4 text-white/70">
                                Same game, completely different night. Your squad is the difference between a queue and a story worth telling tomorrow.
                            </p>
                            {canRegister && !user && (
                                <Link
                                    href={route('register')}
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                                >
                                    Find your squad — free
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

                {/* ── Creator Spotlight ───────────────────────────── */}
                {featuredCreators && featuredCreators.length > 0 && (
                    <section className="mx-auto max-w-6xl px-6 py-16 lg:px-12">
                        <CreatorSpotlight
                            creators={featuredCreators}
                            heading="Creators worth following"
                            subheading="Streamers and content creators already building their audience on SquadSpawn."
                        />
                    </section>
                )}

                {/* ── Why we're different ─────────────────────────── */}
                <section className="mx-auto max-w-6xl px-6 py-20 lg:px-12">
                    <div className="mb-12 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Why SquadSpawn</p>
                        <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">Playing with randoms is broken.</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-ink-500">We fixed the three things every LFG site gets wrong.</p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <FeatureCard
                            iconClass="text-gaming-orange"
                            title="Ratings after every session"
                            body="Play a match, rate your teammates. Toxic players drop fast and stop showing up in your feed. Solid teammates get a ★ score — and the host sees it before they accept you."
                            icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.3h7.6l-6.2 4.5 2.4 7.3L12 16.6l-6.2 4.5 2.4-7.3L2 9.3h7.6L12 2z" /></svg>}
                        />
                        <FeatureCard
                            iconClass="text-gaming-cyan"
                            title="Steam-verified gamers"
                            body="Link your Steam and your actual playtime, game library, and recent matches show up on your profile. No faked ranks. No smurfs pretending they're new."
                            icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm2.9 13.5a2.1 2.1 0 01-2.08-1.56l-2.04-.85a1.8 1.8 0 10.1-1.4l1.9.78a2.1 2.1 0 11.02 3zm-3.6-2.37l-.83-.34a2.6 2.6 0 113.37-2.9l-2.07.87zm5.05 1.2a1.42 1.42 0 11-.01-2.84 1.42 1.42 0 010 2.84z" /></svg>}
                        />
                        <FeatureCard
                            iconClass="text-gaming-green"
                            title="No toxic randoms"
                            body="Real moderators, clear rules, one-tap reports, blocks that actually stick. Griefers and ban-evaders don't last long. This is the lobby you actually want to load into."
                            icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>}
                        />
                    </div>
                </section>

                {/* ── How it works ────────────────────────────────── */}
                <section id="how" className="relative overflow-hidden bg-bone-100 py-20">
                    <div className="absolute inset-0 opacity-10">
                        <img src="/images/gamer6.jpg" alt="" className="h-full w-full object-cover" loading="lazy" />
                    </div>

                    <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
                        <div className="mb-12 text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-neon-red">How it works</p>
                            <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">From sign-up to first squad in 3 steps.</h2>
                        </div>

                        <div className="grid gap-6 md:grid-cols-3">
                            <StepCard n="1" image="/images/gamer2.jpg" title="Set up your gamer profile" body="Add the games you play, your ranks, and link your Steam if you want to flex the receipts. Your real playtime, game library and recent matches show up instantly." />
                            <StepCard n="2" image="/images/gamer3.jpg" title="Find or post an LFG" body="Scroll live squads by game, region, rank, mic on/off. Or drop your own LFG — solid hosts rise to the top, first-timers get a tag so nobody's guessing." />
                            <StepCard n="3" image="/images/gamer4.jpg" title="Rate your teammates" body="After every session, tap a rating. Legends climb, toxic randoms vanish from your feed. Good teammates get favourited so you can squad up again in one tap." />
                        </div>

                        {canRegister && !user && (
                            <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-neon-red/25 bg-white p-6 shadow-sm shadow-neon-red/5 sm:flex-row sm:gap-6 sm:p-8">
                                <div className="text-center sm:text-left">
                                    <p className="text-sm font-bold uppercase tracking-wider text-neon-red">Three minutes. Free forever.</p>
                                    <p className="mt-1 text-lg font-bold text-ink-900">Your squad is three clicks away.</p>
                                </div>
                                <Link
                                    href={route('register')}
                                    className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                                >
                                    {isFounderPhase ? 'Claim founder spot' : 'Sign up free'}
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── LFG trust-card mockup ───────────────────────── */}
                <section className="mx-auto max-w-6xl px-6 py-20 lg:px-12">
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Trust signals</p>
                            <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">See who you're joining — before you join.</h2>
                            <p className="mt-4 text-ink-500">
                                Every LFG shows the host's rep score, how many squads they've run, their region, and a green dot if they're online <em>right now</em>. First-time host? You'll know. Played with them before? There's a badge for that too. Never queue blind again.
                            </p>
                            <ul className="mt-6 space-y-2 text-sm text-ink-700">
                                <Bullet>★ Rep score from real teammates who played with them</Bullet>
                                <Bullet>Squads run count — or "First-time host" tag</Bullet>
                                <Bullet>Green dot = online right now</Bullet>
                                <Bullet>Games you both play, highlighted</Bullet>
                                <Bullet>Auto-accept to jump in, or host-approved if you prefer</Bullet>
                            </ul>
                        </div>

                        <MockLfgCard />
                    </div>
                </section>

                {/* ── Integrations ────────────────────────────────── */}
                <section className="border-y border-ink-900/10 bg-bone-100/60 py-20">
                    <div className="mx-auto max-w-6xl px-6 lg:px-12">
                        <div className="mb-10 text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Plug in</p>
                            <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">Your gaming life, connected.</h2>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            <IntegrationCard
                                name="Steam"
                                status="Live"
                                description="Link your Steam and your real playtime, game library, and recent matches show up on your profile. No more faking ranks."
                                color="border-[#66c0f4]/40 bg-[#66c0f4]/5 text-[#66c0f4]"
                            />
                            <IntegrationCard
                                name="Discord"
                                status="Live"
                                description="Drop your Discord voice channel on any LFG — your squad one-clicks in and starts talking. Full Discord sign-in coming soon."
                                color="border-[#5865F2]/40 bg-[#5865F2]/5 text-[#5865F2]"
                            />
                            <IntegrationCard
                                name="Creator"
                                status="Live"
                                description="Stream on Twitch, post on YouTube, clip on TikTok? Link it all to your profile and get featured in the Creator Spotlight. Let your plays speak before anyone accepts."
                                color="border-gaming-pink/40 bg-gaming-pink/5 text-gaming-pink"
                            />
                            <IntegrationCard
                                name="Riot / Faceit"
                                status="Coming soon"
                                description="Soon: your Valorant, League, and CS2 rank + match history pulled straight to your profile. No more rank-lying randoms."
                                color="border-gaming-orange/40 bg-gaming-orange/5 text-gaming-orange"
                            />
                        </div>
                    </div>
                </section>

                {/* ── Reputation deep-dive ────────────────────────── */}
                <section className="mx-auto max-w-6xl px-6 py-20 lg:px-12">
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                        <div className="order-2 lg:order-1">
                            <img src="/images/leaderboard.svg" alt="" className="w-full max-w-md" />
                        </div>
                        <div className="order-1 lg:order-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Reputation</p>
                            <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">Your word, backed by receipts.</h2>
                            <p className="mt-4 text-ink-500">
                                Your rep score comes from the teammates you actually played with, after actual sessions. One salty rating won't sink you — a pattern will. Play well, climb the board. Play toxic, disappear from feeds.
                            </p>
                            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <RepChip label="★ 4.5+" sub="All-star" color="text-gaming-orange" />
                                <RepChip label="★ 4.0+" sub="Reliable" color="text-gaming-green" />
                                <RepChip label="First-time" sub="New host" color="text-gaming-cyan" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Billboard pair: Legends + No More Solo ──────── */}
                {/* Always-dark frame so the neon/black tiles breathe in
                    both themes. */}
                <section className="relative overflow-hidden bg-[#14121A]">
                    <div className="mx-auto grid max-w-6xl gap-4 px-6 py-12 sm:grid-cols-2 sm:gap-6 sm:py-16 lg:px-12">
                        <a
                            href={canRegister && !user ? route('register') : '#'}
                            className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 transition hover:ring-neon-red/50 hover:-translate-y-0.5"
                            aria-label="Sign up — legends don't solo queue"
                        >
                            <img
                                src="/images/legends-dont.jpg"
                                alt="Legends don't solo queue"
                                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                                loading="lazy"
                            />
                        </a>
                        <a
                            href={canRegister && !user ? route('register') : '#'}
                            className="group relative overflow-hidden rounded-2xl ring-1 ring-white/10 transition hover:ring-neon-red/50 hover:-translate-y-0.5"
                            aria-label="Sign up — no more solo"
                        >
                            <img
                                src="/images/no-more-solo.jpg"
                                alt="No more solo"
                                className="aspect-square w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                                loading="lazy"
                            />
                        </a>
                    </div>
                    {canRegister && !user && (
                        <div className="mx-auto max-w-6xl px-6 pb-12 text-center lg:px-12 sm:pb-16">
                            <Link
                                href={route('register')}
                                className="inline-flex items-center gap-2 rounded-xl bg-neon-red px-7 py-3 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                            >
                                Stop solo-queueing — sign up free
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                </svg>
                            </Link>
                        </div>
                    )}
                </section>

                {/* ── Community highlight ─────────────────────────── */}
                <section className="relative overflow-hidden py-20">
                    <div className="absolute inset-0 -z-10">
                        <img src="/images/gamer5.jpg" alt="" className="h-full w-full object-cover opacity-45" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-b from-bone-50 via-bone-50/60 to-bone-50" />
                    </div>

                    <div className="mx-auto max-w-6xl px-6 lg:px-12">
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Community</p>
                                <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">More than a matchmaker.</h2>
                                <p className="mt-4 text-ink-500">
                                    Drop clips, screenshots, guides, strats, rants. Gamers running the feed — not bots. Clear rules, fair reports, mod decisions you can actually see.
                                </p>
                                <ul className="mt-5 space-y-2 text-sm text-ink-700">
                                    <Bullet>📝 Clips, screenshots, guides, rants — format how you want</Bullet>
                                    <Bullet>🛡 Real mods, public decisions, no shadow-bans</Bullet>
                                    <Bullet>🎯 Filter by game, sort hot or new, pinned posts up top</Bullet>
                                    <Bullet>📢 Clear rules — no guessing what flies and what doesn't</Bullet>
                                </ul>
                            </div>

                            <div className="rounded-3xl border border-ink-900/10 bg-white p-6 shadow-xl">
                                <img src="/images/squad-chat.svg" alt="" className="mx-auto w-full max-w-sm" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Inline CTA — social proof (only once we have crowd) ── */}
                {canRegister && !user && SHOW_SOCIAL_PROOF_STRIP && (
                    <section className="mx-auto max-w-6xl px-6 lg:px-12">
                        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-ink-900/10 bg-white p-6 shadow-sm sm:flex-row sm:gap-6 sm:p-8">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {recentPlayers.slice(0, 4).map((p) => (
                                        <div key={p.id} className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-bone-100 ring-1 ring-ink-900/10">
                                            {p.avatar ? (
                                                <img src={p.avatar} alt="" className="h-full w-full object-cover" loading="lazy" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-ink-500">
                                                    {p.username.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-sm font-bold text-ink-900">
                                        Joined by {totalPlayers.toLocaleString()} gamers who read the scoreboard.
                                    </p>
                                    {SHOW_ONLINE_COUNT && (
                                        <p className="text-xs text-ink-500">
                                            <span className="text-gaming-green">●</span> {onlineNow.toLocaleString()} online now · zero randoms
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Link
                                href={route('register')}
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                            >
                                Join them
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                </svg>
                            </Link>
                        </div>
                    </section>
                )}

                {/* ── Founder CTA ────────────────────────────────── */}
                {isFounderPhase && (
                    <section className="relative overflow-hidden border-y border-neon-red/20 py-16">
                        <div className="absolute inset-0 -z-10">
                            <img
                                src="/images/we-spawned.jpg"
                                alt=""
                                className="h-full w-full object-cover opacity-25"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-red/15 via-transparent to-transparent" />
                            <div className="absolute inset-0 bg-bone-50/70 dark:bg-ink-900/70" />
                        </div>
                        <div className="mx-auto max-w-4xl px-6 text-center lg:px-12">
                            <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Founder Phase</p>
                            <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">
                                {SHOW_FOUNDER_COUNTS
                                    ? <>Be #{founderNumber.toLocaleString()} of {FOUNDER_CAP}.</>
                                    : <>Join the first {FOUNDER_CAP} gamers.</>}
                            </h2>
                            <p className="mx-auto mt-4 max-w-xl text-ink-500">
                                The first {FOUNDER_CAP} members get a permanent Founder badge on their profile. It'll mean something when the community is 10,000 strong.
                            </p>
                            {canRegister && (
                                <Link href={route('register')} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-neon-red px-8 py-3.5 text-base font-bold text-white shadow-glow-red transition hover:bg-neon-red/90">
                                    Claim your founder spot
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                    </svg>
                                </Link>
                            )}
                        </div>
                    </section>
                )}

                {/* ── FAQ ──────────────────────────────────────────── */}
                <section className="mx-auto max-w-3xl px-6 py-20 lg:px-12">
                    <div className="mb-10 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-neon-red">FAQ</p>
                        <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">Quick answers.</h2>
                    </div>
                    <div className="space-y-3">
                        <Faq q="Is it free?">Fully free. No ads, no premium tier, no paywall. Every core feature is open to everyone.</Faq>
                        <Faq q="Do I need Steam?">Nope. Steam linking is optional — but it's the fastest way to prove you actually play what you say you play. No faked ranks, no smurfs.</Faq>
                        <Faq q="Do I need a mic?">Nah. LFG hosts decide if mic is required. Filter the feed by 🎤 Mic required if that's your vibe, or skip it if you're chill either way.</Faq>
                        <Faq q="What happens to toxic players?">Teammate ratings build your public rep score. Repeat toxicity or breaking the rules gets posts hidden, threads locked, or accounts banned. Mod calls are public — no shadow-bans.</Faq>
                        <Faq q="Is there an app?">Install SquadSpawn straight to your phone's home screen from any browser — it runs like a native app with push notifications for squad invites, accepts, and chat.</Faq>
                        <Faq q="How does the rep score actually work?">It's based on real teammate ratings after real sessions. One bad rating won't torch you — a pattern will. Solid players climb; toxic ones fade from feeds fast.</Faq>
                    </div>
                </section>

                {/* ── Final CTA + Footer ──────────────────────────── */}
                <section className="relative overflow-hidden bg-ink-900 py-16 dark:bg-bone-50">
                    <div className="absolute inset-0 opacity-30">
                        <img src="/images/gamer8.jpg" alt="" className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 to-transparent dark:from-bone-50" />
                    </div>

                    <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-12">
                        <h2 className="text-3xl font-black text-white sm:text-4xl dark:text-ink-900">
                            {SHOW_ONLINE_COUNT ? 'Your next squad is already online.' : 'Your founder squad is forming.'}
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-white/70 dark:text-ink-500">
                            {SHOW_ONLINE_COUNT ? (
                                <>
                                    <strong className="text-gaming-green">{onlineNow.toLocaleString()}</strong> gamers are active right now across {totalGames.toLocaleString()}+ games. Jump in.
                                </>
                            ) : (
                                <>
                                    Claim one of the first {FOUNDER_CAP} founder spots. {totalGames.toLocaleString()}+ games already in the library, waiting for your squad.
                                </>
                            )}
                        </p>
                        {canRegister && (
                            <Link href={route('register')} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-neon-red px-8 py-3.5 text-base font-bold text-white shadow-glow-red transition hover:bg-neon-red/90">
                                Get started — it's free
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                </svg>
                            </Link>
                        )}
                    </div>
                </section>

                <footer className="border-t border-ink-900/10 bg-bone-50 px-6 py-8 pb-24 lg:px-12 sm:pb-8">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-ink-500 sm:flex-row">
                        <div className="flex flex-wrap items-center gap-4">
                            <Link href={route('help')} className="hover:text-ink-900">Help</Link>
                            <Link href={route('changelog.index')} className="hover:text-ink-900">Changelog</Link>
                            <a href="/privacy-policy" className="hover:text-ink-900">Privacy</a>
                            <a href="/terms-of-service" className="hover:text-ink-900">Terms</a>
                            <a href="/cookie-policy" className="hover:text-ink-900">Cookies</a>
                            <Link href={route('community.guidelines')} className="hover:text-ink-900">Community guidelines</Link>
                            <Link href="/plus" className="font-semibold text-neon-red hover:text-neon-red/80">
                                ✨ Plus waitlist
                            </Link>
                            <Link href="/contact" className="hover:text-ink-900">Contact</Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <a
                                href="https://instagram.com/squadspawnhq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md bg-gaming-pink/10 px-2.5 py-1 font-medium text-gaming-pink transition hover:bg-gaming-pink/20"
                                aria-label="Follow SquadSpawn on Instagram"
                            >
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                                @squadspawnhq
                            </a>
                            <a
                                href="https://www.facebook.com/squadspawnhq"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#1877F2]/10 px-2.5 py-1 font-medium text-[#1877F2] transition hover:bg-[#1877F2]/20"
                                aria-label="Follow SquadSpawn on Facebook"
                            >
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                /squadspawnhq
                            </a>
                            <a
                                href="https://www.reddit.com/user/Squadspawn/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-md bg-[#FF4500]/10 px-2.5 py-1 font-medium text-[#FF4500] transition hover:bg-[#FF4500]/20"
                                aria-label="Follow SquadSpawn on Reddit"
                            >
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.983 0 1.78.797 1.78 1.78 0 .703-.41 1.307-1.002 1.594a3.54 3.54 0 0 1 .046.572c0 2.908-3.384 5.265-7.558 5.265-4.174 0-7.558-2.357-7.558-5.265 0-.194.016-.385.046-.572-.593-.287-1.002-.891-1.002-1.594 0-.983.797-1.78 1.78-1.78.477 0 .899.182 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.91-4.27a.39.39 0 0 1 .454-.303l2.971.627a1.25 1.25 0 0 1 1.217-.947zM9.332 14.008c-.757 0-1.369.559-1.369 1.253 0 .694.612 1.253 1.369 1.253s1.368-.559 1.368-1.253c0-.694-.611-1.253-1.368-1.253zm5.386 0c-.757 0-1.368.559-1.368 1.253 0 .694.611 1.253 1.368 1.253s1.369-.559 1.369-1.253c0-.694-.612-1.253-1.369-1.253zm-5.27 3.487a.27.27 0 0 0-.192.45c.775.775 2.256.836 2.69.836.433 0 1.915-.061 2.69-.836a.27.27 0 0 0-.038-.41.28.28 0 0 0-.375.02c-.488.49-1.53.664-2.277.664-.746 0-1.788-.174-2.277-.664a.28.28 0 0 0-.22-.06z" /></svg>
                                u/Squadspawn
                            </a>
                            <p>
                                &copy; {new Date().getFullYear()} SquadSpawn · Built by{' '}
                                <a href="https://budgetpixels.nl" target="_blank" rel="noopener noreferrer" className="text-neon-red transition hover:text-neon-red/80">
                                    BudgetPixels.nl
                                </a>
                            </p>
                        </div>
                    </div>
                </footer>

                {/* ── Sticky mobile CTA — signed-out only ────────── */}
                {canRegister && !user && (
                    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neon-red/30 bg-[#14121A]/95 px-4 py-3 backdrop-blur-sm shadow-[0_-8px_24px_rgba(0,0,0,0.3)] sm:hidden">
                        <Link
                            href={route('register')}
                            className="flex items-center justify-between gap-3 rounded-xl bg-neon-red px-4 py-3 text-sm font-bold text-white shadow-glow-red transition active:bg-neon-red/80"
                        >
                            <span className="flex items-center gap-2">
                                {isFounderPhase ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                                        </span>
                                        {SHOW_FOUNDER_COUNTS
                                            ? `Claim founder spot · ${founderSpotsLeft} left`
                                            : 'Claim your founder spot'}
                                    </>
                                ) : (
                                    <>Sign up free · find your squad</>
                                )}
                            </span>
                            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}

// ── Sub-components ───────────────────────────────────────────────────

function FeatureCard({ icon, iconClass, title, body }: { icon: React.ReactNode; iconClass: string; title: string; body: string }) {
    return (
        <div className="group rounded-2xl border border-ink-900/10 bg-white p-6 transition hover:border-neon-red/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-neon-red/5">
            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-ink-900/5 ${iconClass}`}>
                <span className="h-6 w-6">{icon}</span>
            </div>
            <h3 className="text-lg font-bold text-ink-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{body}</p>
        </div>
    );
}

function StepCard({ n, image, title, body }: { n: string; image: string; title: string; body: string }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-sm">
            <div className="relative aspect-[16/9] overflow-hidden">
                <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-neon-red text-lg font-black text-white shadow-glow-red">
                    {n}
                </span>
            </div>
            <div className="p-6">
                <h3 className="text-lg font-bold text-ink-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{body}</p>
            </div>
        </div>
    );
}

function Bullet({ children }: { children: React.ReactNode }) {
    return (
        <li className="flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{children}</span>
        </li>
    );
}

function IntegrationCard({ name, status, description, color }: { name: string; status: string; description: string; color: string }) {
    return (
        <div className={`rounded-2xl border bg-white p-5 ${color}`}>
            <div className="flex items-center justify-between">
                <span className="text-lg font-black">{name}</span>
                <span className="rounded-full border border-current/40 bg-current/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                    {status}
                </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-500">{description}</p>
        </div>
    );
}

function RepChip({ label, sub, color }: { label: string; sub: string; color: string }) {
    return (
        <div className="rounded-xl border border-ink-900/10 bg-white p-3 text-center">
            <div className={`text-lg font-black ${color}`}>{label}</div>
            <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">{sub}</div>
        </div>
    );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
    return (
        <details className="group rounded-xl border border-ink-900/10 bg-white p-5 open:shadow-sm">
            <summary className="flex cursor-pointer items-center justify-between list-none text-sm font-bold text-ink-900">
                {q}
                <svg className="h-5 w-5 text-ink-500 transition group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">{children}</p>
        </details>
    );
}

function MockLfgCard() {
    return (
        <div className="overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-xl">
            <div className="relative aspect-[16/9] overflow-hidden bg-ink-900">
                <img src="/images/gamer7.jpg" alt="" className="h-full w-full object-cover opacity-80" loading="lazy" />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                <span className="absolute left-3 top-3 rounded-full bg-neon-red px-2 py-0.5 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(230,0,46,0.5)]">
                    ⚡ Auto-join
                </span>
                <span className="absolute bottom-3 left-4 text-sm font-bold text-white drop-shadow-md">
                    Counter-Strike 2
                </span>
            </div>
            <div className="p-5">
                <div className="flex items-start gap-3">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neon-red/20 text-sm font-bold text-neon-red">
                        N
                        <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-gaming-green shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink-900">
                            NovaClutch
                            <span className="rounded-full bg-gaming-cyan/20 px-1.5 py-0 text-[9px] font-bold text-gaming-cyan">MOD</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                            <span className="flex items-center gap-0.5 font-semibold text-gaming-orange">
                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                4.8
                            </span>
                            <span>42 hosted</span>
                            <span>· EU</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                            <span className="rounded-full bg-gaming-green/15 px-2 py-0.5 text-[10px] font-bold text-gaming-green">✓ Played before</span>
                        </div>
                    </div>
                </div>

                <h3 className="mt-4 text-base font-bold text-ink-900">Need one more for Premier · Diamond+</h3>
                <p className="mt-1 text-xs text-ink-500">Posted 3m ago · 🎤 Mic required · EN</p>

                <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-ink-500">4/5 spots</span>
                        <span className="font-medium text-gaming-green">Open</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-ink-900/10">
                        <div className="h-full rounded-full bg-gaming-green transition-all" style={{ width: '80%' }} />
                    </div>
                </div>

                <button className="mt-4 w-full rounded-lg bg-gaming-green/10 px-4 py-2 text-sm font-semibold text-gaming-green border border-gaming-green/30 cursor-default">
                    ⚡ Join instantly
                </button>
            </div>
        </div>
    );
}
