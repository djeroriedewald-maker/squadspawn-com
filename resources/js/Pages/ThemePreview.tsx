import { Head, Link } from '@inertiajs/react';

const games = [
    { name: 'Valorant', image: '/images/games/valorant.jpg' },
    { name: 'Fortnite', image: '/images/games/fortnite.jpg' },
    { name: 'League of Legends', image: '/images/games/lol.jpg' },
    { name: 'Apex Legends', image: '/images/games/apex.jpg' },
    { name: 'Counter-Strike 2', image: '/images/games/cs2.jpg' },
    { name: 'Overwatch 2', image: '/images/games/overwatch2.jpg' },
    { name: 'Rocket League', image: '/images/games/rocketleague.jpg' },
    { name: 'Mobile Legends', image: '/images/games/mlbb.jpg' },
];

// Scoped styles — keep the preview isolated from app.css
const previewStyles = `
    .tp-root {
        --bone: #F4F1EC;
        --bone-2: #EAE5DC;
        --ink: #14121A;
        --ink-2: #1E1B25;
        --line: rgba(20, 18, 26, 0.08);
        --muted: #6B6A72;
        --red: #E6002E;
        --red-deep: #B3001F;
        --red-glow: rgba(255, 0, 62, 0.55);
        background: var(--bone);
        color: var(--ink);
        font-family: Figtree, ui-sans-serif, system-ui, sans-serif;
        background-image:
            radial-gradient(ellipse at 15% 10%, rgba(230, 0, 46, 0.06) 0%, transparent 45%),
            radial-gradient(ellipse at 85% 85%, rgba(20, 18, 26, 0.05) 0%, transparent 50%);
    }
    .tp-grid-texture {
        background-image:
            linear-gradient(rgba(20, 18, 26, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(20, 18, 26, 0.04) 1px, transparent 1px);
        background-size: 44px 44px;
    }
    .tp-neon-text {
        color: var(--red);
        text-shadow: 0 0 1px rgba(230, 0, 46, 0.6), 0 0 14px rgba(230, 0, 46, 0.45);
    }
    .tp-neon-text-dark {
        color: #FF2D55;
        text-shadow: 0 0 6px rgba(255, 0, 62, 0.65), 0 0 28px rgba(255, 0, 62, 0.35);
    }
    .tp-btn-primary {
        background: var(--red);
        color: white;
        border: 1px solid var(--red);
        box-shadow: 0 0 0 1px rgba(230, 0, 46, 0.25), 0 6px 24px -8px rgba(230, 0, 46, 0.55);
        transition: all .2s ease;
    }
    .tp-btn-primary:hover {
        box-shadow: 0 0 0 1px rgba(230, 0, 46, 0.35), 0 10px 34px -6px rgba(230, 0, 46, 0.7), inset 0 0 24px rgba(255, 255, 255, 0.08);
        transform: translateY(-1px);
    }
    .tp-btn-ghost {
        background: transparent;
        color: var(--ink);
        border: 1px solid var(--line);
        transition: all .2s ease;
    }
    .tp-btn-ghost:hover {
        border-color: var(--red);
        color: var(--red);
    }
    .tp-card {
        background: white;
        border: 1px solid var(--line);
        border-radius: 16px;
        transition: all .25s ease;
    }
    .tp-card:hover {
        border-color: rgba(230, 0, 46, 0.45);
        box-shadow: 0 0 0 1px rgba(230, 0, 46, 0.1), 0 14px 40px -16px rgba(230, 0, 46, 0.25);
        transform: translateY(-2px);
    }
    .tp-panel-dark {
        background: linear-gradient(180deg, #17141D 0%, #0F0D14 100%);
        color: #EDEAF0;
        border: 1px solid rgba(255, 0, 62, 0.25);
        border-radius: 20px;
        box-shadow: 0 0 0 1px rgba(255, 0, 62, 0.08), 0 0 60px -20px rgba(255, 0, 62, 0.4), inset 0 0 80px -40px rgba(255, 0, 62, 0.2);
    }
    .tp-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        border-radius: 999px;
        background: rgba(230, 0, 46, 0.08);
        border: 1px solid rgba(230, 0, 46, 0.3);
        color: var(--red-deep);
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
    }
    .tp-badge-dark {
        background: rgba(255, 0, 62, 0.12);
        border: 1px solid rgba(255, 0, 62, 0.4);
        color: #FF2D55;
    }
    .tp-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(230, 0, 46, 0.4), transparent);
    }
    .tp-nav {
        background: rgba(244, 241, 236, 0.85);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--line);
    }
    .tp-logo-mark {
        font-weight: 900;
        letter-spacing: -0.02em;
        color: var(--ink);
    }
    .tp-logo-mark span {
        color: var(--red);
        text-shadow: 0 0 10px rgba(230, 0, 46, 0.4);
    }
    .tp-stat-value {
        font-size: 28px;
        font-weight: 800;
        color: var(--ink);
        letter-spacing: -0.02em;
    }
    .tp-step-num {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--ink);
        color: var(--red);
        font-weight: 800;
        text-shadow: 0 0 10px rgba(230, 0, 46, 0.6);
        border: 1px solid rgba(255, 0, 62, 0.4);
        box-shadow: 0 0 20px -6px rgba(255, 0, 62, 0.5);
    }
    .tp-scan-line {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(180deg, transparent 0, transparent 3px, rgba(255, 255, 255, 0.02) 3px, rgba(255, 255, 255, 0.02) 4px);
        pointer-events: none;
        border-radius: inherit;
    }
    @keyframes tp-flicker {
        0%, 100% { opacity: 1; }
        45% { opacity: 1; }
        47% { opacity: 0.7; }
        48% { opacity: 1; }
        62% { opacity: 0.85; }
        63% { opacity: 1; }
    }
    .tp-flicker { animation: tp-flicker 6s infinite; }
    .tp-live-dot {
        width: 8px; height: 8px; border-radius: 999px;
        background: var(--red);
        box-shadow: 0 0 10px var(--red-glow), 0 0 20px var(--red-glow);
        animation: tp-flicker 2s infinite;
    }
`;

export default function ThemePreview() {
    return (
        <>
            <Head title="Theme Preview — Light + Red Neon" />
            <style dangerouslySetInnerHTML={{ __html: previewStyles }} />

            <div className="tp-root min-h-screen">
                {/* Nav */}
                <nav className="tp-nav sticky top-0 z-20 flex items-center justify-between px-6 py-4 lg:px-12">
                    <div className="flex items-center gap-8">
                        <h1 className="tp-logo-mark text-2xl">
                            SQUAD<span>SPAWN</span>
                        </h1>
                        <div className="hidden gap-6 text-sm font-semibold md:flex" style={{ color: 'var(--muted)' }}>
                            <a href="#" className="hover:text-[color:var(--red)]">Games</a>
                            <a href="#" className="hover:text-[color:var(--red)]">LFG</a>
                            <a href="#" className="hover:text-[color:var(--red)]">Players</a>
                            <a href="#" className="hover:text-[color:var(--red)]">Community</a>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <a href="#" className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>Log in</a>
                        <a href="#" className="tp-btn-primary rounded-lg px-4 py-2 text-sm font-bold">Sign up</a>
                    </div>
                </nav>

                {/* Back-to-live banner */}
                <div className="px-6 py-3 text-center text-xs font-medium lg:px-12" style={{ color: 'var(--muted)' }}>
                    <span className="tp-badge mr-2">PREVIEW</span>
                    Light theme + red neon mockup — <Link href="/" className="underline" style={{ color: 'var(--red)' }}>back to live site</Link>
                </div>

                {/* Hero */}
                <section className="relative overflow-hidden px-6 py-20 lg:px-12 lg:py-28">
                    <div className="tp-grid-texture absolute inset-0 opacity-60" />
                    <div className="relative z-10 mx-auto max-w-6xl">
                        <div className="mb-6 flex flex-wrap items-center gap-3">
                            <span className="tp-badge">
                                <span className="tp-live-dot" />
                                2,348 GAMERS ONLINE NOW
                            </span>
                            <span className="tp-badge">SEASON 04 · LIVE</span>
                        </div>

                        <h1 className="mb-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                            FIND YOUR<br />
                            <span className="tp-neon-text tp-flicker">GAMING SQUAD.</span>
                        </h1>
                        <p className="mb-10 max-w-2xl text-lg" style={{ color: 'var(--muted)' }}>
                            Create LFG groups, find verified teammates, and build your reputation. No more toxic randoms —
                            just gamers who show up, play hard, and level up with you.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <a href="#" className="tp-btn-primary rounded-xl px-8 py-4 text-base font-black tracking-wide">
                                GET STARTED FREE →
                            </a>
                            <a href="#" className="tp-btn-ghost rounded-xl px-8 py-4 text-base font-bold">
                                View Games
                            </a>
                        </div>

                        {/* Stats strip */}
                        <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
                            {[
                                { label: 'PLAYERS', value: '24.5K' },
                                { label: 'GAMES', value: '180+' },
                                { label: 'ACTIVE LFG', value: '342' },
                                { label: 'MATCHES', value: '98K' },
                            ].map((s) => (
                                <div key={s.label} className="border-l-2 pl-4" style={{ borderColor: 'var(--red)' }}>
                                    <div className="text-xs font-bold tracking-widest" style={{ color: 'var(--muted)' }}>
                                        {s.label}
                                    </div>
                                    <div className="tp-stat-value mt-1">{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="tp-divider mx-auto max-w-5xl" />

                {/* The Loop — step cards */}
                <section className="px-6 py-20 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-12 text-center">
                            <span className="tp-badge mb-4">THE LOOP</span>
                            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                                FIND. PLAY. RATE. <span className="tp-neon-text">REPEAT.</span>
                            </h2>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { n: 1, title: 'Create Profile', body: 'Add your games, ranks, and playstyle. Show who you are.' },
                                { n: 2, title: 'Join LFG', body: 'Post a squad or join one. Set mic, rank, platform filters.' },
                                { n: 3, title: 'Play Together', body: 'Group chat, voice, coordinated plays with real teammates.' },
                                { n: 4, title: 'Build Rep', body: 'Rate each session. Trust score grows with every game.' },
                            ].map((step) => (
                                <div key={step.n} className="tp-card p-6">
                                    <div className="tp-step-num mb-5">{step.n}</div>
                                    <h3 className="mb-2 text-lg font-bold">{step.title}</h3>
                                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{step.body}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Dark feature panel — showcase how neon pops against dark */}
                <section className="px-6 py-20 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <div className="tp-panel-dark relative overflow-hidden p-8 sm:p-12 lg:p-16">
                            <div className="tp-scan-line" />
                            <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
                                <div>
                                    <span className="tp-badge tp-badge-dark mb-6">REPUTATION SYSTEM</span>
                                    <h2 className="mb-5 text-4xl font-black tracking-tight sm:text-5xl" style={{ color: '#EDEAF0' }}>
                                        KNOW WHO YOU'RE<br />
                                        <span className="tp-neon-text-dark tp-flicker">PLAYING WITH.</span>
                                    </h2>
                                    <p className="mb-8 text-base leading-relaxed" style={{ color: '#A8A3B0' }}>
                                        Every player has a reputation score built from real teammate ratings.
                                        No more guessing if someone is toxic, a no-show, or elite. Check before you squad up.
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <a href="#" className="tp-btn-primary rounded-lg px-6 py-3 text-sm font-bold">
                                            EXPLORE PLAYERS
                                        </a>
                                        <a href="#" className="rounded-lg border px-6 py-3 text-sm font-bold"
                                            style={{ borderColor: 'rgba(255,0,62,0.4)', color: '#FF2D55' }}>
                                            How it works
                                        </a>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { name: 'NeonRider_92', rep: 98, games: 247, tag: 'LEGEND' },
                                        { name: 'VoidStrike', rep: 91, games: 156, tag: 'VETERAN' },
                                        { name: 'ZeroCooldown', rep: 87, games: 89, tag: 'RISING' },
                                    ].map((p) => (
                                        <div key={p.name} className="flex items-center justify-between rounded-xl border p-4"
                                            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg font-black"
                                                    style={{ background: 'rgba(255,0,62,0.12)', color: '#FF2D55', border: '1px solid rgba(255,0,62,0.3)' }}>
                                                    {p.name[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold" style={{ color: '#EDEAF0' }}>{p.name}</div>
                                                    <div className="text-xs" style={{ color: '#7A7580' }}>{p.games} games played</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="tp-neon-text-dark text-xl font-black">{p.rep}</div>
                                                <div className="text-[10px] font-bold tracking-widest" style={{ color: '#7A7580' }}>{p.tag}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Games strip */}
                <section className="px-6 py-20 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-10 flex items-end justify-between">
                            <div>
                                <span className="tp-badge mb-3">SUPPORTED</span>
                                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                    180+ GAMES. <span className="tp-neon-text">ONE SQUAD.</span>
                                </h2>
                            </div>
                            <a href="#" className="hidden text-sm font-bold sm:block" style={{ color: 'var(--red)' }}>
                                Browse all →
                            </a>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                            {games.map((g) => (
                                <div key={g.name} className="tp-card group overflow-hidden p-0">
                                    <div className="aspect-[3/4] overflow-hidden rounded-[15px]">
                                        <img src={g.image} alt={g.name} className="h-full w-full object-cover grayscale transition group-hover:grayscale-0" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer CTA */}
                <section className="px-6 py-20 lg:px-12">
                    <div className="mx-auto max-w-4xl text-center">
                        <h2 className="mb-6 text-4xl font-black tracking-tight sm:text-5xl">
                            READY TO <span className="tp-neon-text">SPAWN?</span>
                        </h2>
                        <p className="mb-10 text-lg" style={{ color: 'var(--muted)' }}>
                            Join thousands of gamers building their squad right now. Free forever.
                        </p>
                        <a href="#" className="tp-btn-primary inline-block rounded-xl px-10 py-5 text-lg font-black tracking-wider">
                            CLAIM YOUR HANDLE →
                        </a>
                    </div>
                </section>

                <footer className="border-t px-6 py-10 text-center text-sm lg:px-12" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                    <span className="tp-logo-mark">SQUAD<span>SPAWN</span></span>
                    <div className="mt-2">Theme preview · isolated from production styles</div>
                </footer>
            </div>
        </>
    );
}
