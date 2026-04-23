import ThemeToggle from '@/Components/ThemeToggle';
import { Head, Link, usePage } from '@inertiajs/react';
import { Game } from '@/types';

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
}: WelcomeProps) {
    const user = usePage().props.auth?.user;

    const FOUNDER_CAP = 500;
    const isFounderPhase = totalPlayers < FOUNDER_CAP;
    const founderNumber = totalPlayers + 1;
    const founderSpotsLeft = Math.max(FOUNDER_CAP - totalPlayers, 0);

    return (
        <>
            <Head title="Find your squad. Not randoms.">
                <meta name="description" content="SquadSpawn is the reputation-first LFG platform for gamers. Verified teammates, real Steam stats, zero tolerance for toxicity. Find your squad." />
            </Head>

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
                        <img src="/images/hero.jpg" alt="" className="h-full w-full object-cover" loading="eager" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-bone-50 dark:to-bone-50" />
                        <div className="absolute inset-0 bg-grid opacity-30" />
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
                                    Founder phase · {founderSpotsLeft} spots left
                                </div>
                            )}

                            <h1 className="text-4xl font-black leading-[1.05] text-white sm:text-5xl lg:text-7xl">
                                Find your <span className="text-neon-red">squad</span>.
                                <br />
                                Not randoms.
                            </h1>
                            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
                                The reputation-first LFG platform. Verified Steam stats, real teammate ratings, zero tolerance for toxicity. Play with people who actually want to play with <em>you</em>.
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

                            {/* Live stats chips */}
                            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-gaming-green" />
                                    <strong className="text-gaming-green">{onlineNow.toLocaleString()}</strong> online now
                                </span>
                                <span><strong className="text-white">{totalPlayers.toLocaleString()}</strong> gamers</span>
                                <span><strong className="text-white">{totalGames.toLocaleString()}</strong> games</span>
                                <span><strong className="text-white">{activeLfg.toLocaleString()}</strong> active LFGs</span>
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
                                    src={game.cover_image || `/images/games/${game.slug}.svg`}
                                    alt={game.name}
                                    loading="lazy"
                                    onError={onCoverError}
                                    className="h-16 w-28 flex-shrink-0 rounded-lg object-cover opacity-70 transition hover:opacity-100 sm:h-20 sm:w-36"
                                />
                            ))}
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bone-50 to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bone-50 to-transparent" />
                    </div>
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
                            title="Reputation-first"
                            body="Every session ends with teammate ratings. Toxic players drop to 1 star and get filtered out. Nice players get a visible ★ score hosts see before they accept you."
                            icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.3h7.6l-6.2 4.5 2.4 7.3L12 16.6l-6.2 4.5 2.4-7.3L2 9.3h7.6L12 2z" /></svg>}
                        />
                        <FeatureCard
                            iconClass="text-gaming-cyan"
                            title="Steam-verified"
                            body="Link your Steam and your real playtime + owned games + recent activity show on your profile. No more faking rank, no more smurfs pretending to be new."
                            icon={<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm2.9 13.5a2.1 2.1 0 01-2.08-1.56l-2.04-.85a1.8 1.8 0 10.1-1.4l1.9.78a2.1 2.1 0 11.02 3zm-3.6-2.37l-.83-.34a2.6 2.6 0 113.37-2.9l-2.07.87zm5.05 1.2a1.42 1.42 0 11-.01-2.84 1.42 1.42 0 010 2.84z" /></svg>}
                        />
                        <FeatureCard
                            iconClass="text-gaming-green"
                            title="Anti-toxic by design"
                            body="Moderator team, community guidelines, one-click reports, blocks that work both ways. Ban evasion gets you out fast. This is the community we'd want to play in."
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
                            <StepCard n="1" image="/images/gamer2.jpg" title="Build your gamer profile" body="Add the games you play, your ranks, and link your Steam. Your profile instantly shows your real playtime, owned library, and recent activity." />
                            <StepCard n="2" image="/images/gamer3.jpg" title="Find or host an LFG" body="Browse live squads filtered by game, region, rank, mic preference. Or post your own — hosts with a track record get higher visibility." />
                            <StepCard n="3" image="/images/gamer4.jpg" title="Rate teammates, build rep" body="After each session, rate who you played with. Your score stays visible. Good teammates get favourited. Bad ones filter out of future LFGs." />
                        </div>
                    </div>
                </section>

                {/* ── LFG trust-card mockup ───────────────────────── */}
                <section className="mx-auto max-w-6xl px-6 py-20 lg:px-12">
                    <div className="grid items-center gap-10 lg:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Trust signals</p>
                            <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">See who you're joining — before you join.</h2>
                            <p className="mt-4 text-ink-500">
                                Every LFG card shows the host's reputation score, sessions hosted, region, and whether they're online <em>right now</em>. A first-time host is flagged. A friend you've played with gets a "played before" badge. You'll never join blind.
                            </p>
                            <ul className="mt-6 space-y-2 text-sm text-ink-700">
                                <Bullet>★ Reputation score from rated teammates</Bullet>
                                <Bullet>N sessions hosted — or "First-time host"</Bullet>
                                <Bullet>Green dot when the host is online now</Bullet>
                                <Bullet>Shared games surfaced at a glance</Bullet>
                                <Bullet>Auto-accept for instant join, or manual approval</Bullet>
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
                                description="Link your SteamID and your real playtime, owned games, and recent activity show on your profile."
                                color="border-[#66c0f4]/40 bg-[#66c0f4]/5 text-[#66c0f4]"
                            />
                            <IntegrationCard
                                name="Discord"
                                status="Coming soon"
                                description="One-click Discord OAuth + per-squad voice channels linked straight to your LFG chat."
                                color="border-[#5865F2]/40 bg-[#5865F2]/5 text-[#5865F2]"
                            />
                            <IntegrationCard
                                name="RAWG"
                                status="Live"
                                description="Catalogue of 600k+ games with cover art and platform metadata — added automatically."
                                color="border-gaming-orange/40 bg-gaming-orange/5 text-gaming-orange"
                            />
                            <IntegrationCard
                                name="Riot / Faceit"
                                status="On the roadmap"
                                description="Rank sync for Valorant, League, CS2 match history — so you don't have to take anyone's word for it."
                                color="border-gaming-pink/40 bg-gaming-pink/5 text-gaming-pink"
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
                                Your reputation score is computed from teammate ratings across every session. We weight it so one bad rating won't torch you, but a pattern will. Honest players rise; toxic ones sink.
                            </p>
                            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <RepChip label="★ 4.5+" sub="All-star" color="text-gaming-orange" />
                                <RepChip label="★ 4.0+" sub="Reliable" color="text-gaming-green" />
                                <RepChip label="First-time" sub="New host" color="text-gaming-cyan" />
                            </div>
                        </div>
                    </div>
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
                                    Rich-text posts with images and YouTube embeds. Volunteer moderators keep the feed clean. Community guidelines are public, reports are actioned, decisions are audited.
                                </p>
                                <ul className="mt-5 space-y-2 text-sm text-ink-700">
                                    <Bullet>📝 Rich-text posts — images, video, headings, lists</Bullet>
                                    <Bullet>🛡 Moderator team + transparent audit log</Bullet>
                                    <Bullet>🎯 Filter by game, type, pinned posts first</Bullet>
                                    <Bullet>📢 Community guidelines — no guessing what's allowed</Bullet>
                                </ul>
                            </div>

                            <div className="rounded-3xl border border-ink-900/10 bg-white p-6 shadow-xl">
                                <img src="/images/squad-chat.svg" alt="" className="mx-auto w-full max-w-sm" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Founder CTA ────────────────────────────────── */}
                {isFounderPhase && (
                    <section className="border-y border-neon-red/20 bg-gradient-to-br from-neon-red/10 via-neon-red/5 to-transparent py-16">
                        <div className="mx-auto max-w-4xl px-6 text-center lg:px-12">
                            <p className="text-xs font-bold uppercase tracking-widest text-neon-red">Founder Phase</p>
                            <h2 className="mt-2 text-3xl font-black text-ink-900 sm:text-4xl">
                                Be #{founderNumber.toLocaleString()} of {FOUNDER_CAP}.
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
                        <Faq q="Is it free?">Yes, fully free. No ads, no premium tier, no paywall on any core feature.</Faq>
                        <Faq q="Do I need Steam?">No. Steam linking is optional but recommended — it's the fastest way to prove your playtime and rank legitimacy to potential teammates.</Faq>
                        <Faq q="Do I need a mic?">Nope. LFG posts can require mics or not. Filter the feed by "🎤 Mic required" if that's what you're after.</Faq>
                        <Faq q="What happens to toxic players?">Rated teammates contribute to a visible reputation score. Repeat toxicity or policy violations get posts hidden, threads locked, or accounts banned. Moderator actions are logged.</Faq>
                        <Faq q="Is there an app?">It's a PWA — install from your browser to your home screen and it behaves like a native app, with push notifications for requests, accepts, and chat.</Faq>
                        <Faq q="How does the reputation system weight ratings?">One rating is 70% real + 30% neutral. Three or more ratings use 100% real. Tags (like "toxic" or "great teammate") nudge the score up or down.</Faq>
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
                            Your next squad is already online.
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-white/70 dark:text-ink-500">
                            <strong className="text-gaming-green">{onlineNow.toLocaleString()}</strong> gamers are active right now across {totalGames.toLocaleString()}+ games. Jump in.
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

                <footer className="border-t border-ink-900/10 bg-bone-50 px-6 py-8 lg:px-12">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-ink-500 sm:flex-row">
                        <div className="flex flex-wrap items-center gap-4">
                            <Link href={route('help')} className="hover:text-ink-900">Help</Link>
                            <Link href={route('changelog.index')} className="hover:text-ink-900">Changelog</Link>
                            <a href="/privacy-policy" className="hover:text-ink-900">Privacy</a>
                            <a href="/terms-of-service" className="hover:text-ink-900">Terms</a>
                            <a href="/cookie-policy" className="hover:text-ink-900">Cookies</a>
                            <Link href={route('community.guidelines')} className="hover:text-ink-900">Community guidelines</Link>
                        </div>
                        <p>
                            &copy; {new Date().getFullYear()} SquadSpawn · Built by{' '}
                            <a href="https://budgetpixels.nl" target="_blank" rel="noopener noreferrer" className="text-neon-red transition hover:text-neon-red/80">
                                BudgetPixels.nl
                            </a>
                        </p>
                    </div>
                </footer>
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
