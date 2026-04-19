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

const gameCovers = [
    { name: 'Mobile Legends', image: '/images/games/mlbb.jpg' },
    { name: 'Valorant', image: '/images/games/valorant.jpg' },
    { name: 'Fortnite', image: '/images/games/fortnite.jpg' },
    { name: 'League of Legends', image: '/images/games/lol.jpg' },
    { name: 'PUBG Mobile', image: '/images/games/pubgm.jpg' },
    { name: 'Apex Legends', image: '/images/games/apex.jpg' },
    { name: 'Counter-Strike 2', image: '/images/games/cs2.jpg' },
    { name: 'Genshin Impact', image: '/images/games/genshin.jpg' },
    { name: 'Overwatch 2', image: '/images/games/overwatch2.jpg' },
    { name: 'Dota 2', image: '/images/games/dota2.jpg' },
    { name: 'Free Fire', image: '/images/games/freefire.jpg' },
    { name: 'Honor of Kings', image: '/images/games/hok.jpg' },
    { name: 'Call of Duty: Mobile', image: '/images/games/codm.jpg' },
    { name: 'Rocket League', image: '/images/games/rocketleague.jpg' },
    { name: 'Minecraft', image: '/images/games/minecraft.png' },
    { name: 'Brawl Stars', image: '/images/games/brawlstars.jpg' },
    { name: 'Clash Royale', image: '/images/games/clashroyale.jpg' },
    { name: 'Arena of Valor', image: '/images/games/aov.jpg' },
    { name: 'Stumble Guys', image: '/images/games/stumbleguys.jpg' },
];

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

    // Early-access framing while community is small. Flips to standard
    // social proof once the platform has real scale.
    const FOUNDER_CAP = 500;
    const isFounderPhase = totalPlayers < FOUNDER_CAP;
    const founderNumber = totalPlayers + 1;
    const founderSpotsLeft = Math.max(FOUNDER_CAP - totalPlayers, 0);

    return (
        <>
            <Head title="Find Your Gaming Squad" />

            <div className="min-h-screen bg-bone-50 text-ink-900">
                {/* Nav */}
                <nav className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-12">
                    <span className="text-2xl font-bold text-neon-red">
                        SquadSpawn
                    </span>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/80"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                {canLogin && (
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-medium text-ink-700 transition hover:text-ink-900"
                                    >
                                        Log in
                                    </Link>
                                )}
                                {canRegister && (
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/80"
                                    >
                                        Sign up
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </nav>

                {/* Scrolling Game Banner */}
                <div className="relative overflow-hidden border-y border-ink-900/5 bg-bone-100/50 py-3">
                    <div className="animate-scroll flex gap-4">
                        {[...gameCovers, ...gameCovers, ...gameCovers].map((game, i) => (
                            <div key={i} className="flex-shrink-0">
                                <img
                                    src={game.image}
                                    alt={game.name}
                                    className="h-16 w-28 rounded-lg object-cover opacity-60 transition hover:opacity-100 sm:h-20 sm:w-36"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-bone-50 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-bone-50 to-transparent" />
                </div>

                {/* Hero */}
                <section className="relative overflow-hidden px-6 pb-24 pt-16 lg:px-12 lg:pt-24">
                    {/* Game collage background */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-4 gap-1 opacity-[0.07]">
                        {[...gameCovers, ...gameCovers, ...gameCovers, ...gameCovers].slice(0, 16).map((game, i) => (
                            <img key={i} src={game.image} alt="" className="h-full w-full object-cover" />
                        ))}
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bone-50/60 via-bone-50/90 to-bone-50" />

                    <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-red/30 bg-neon-red/10 px-4 py-1.5 text-sm font-bold tracking-wide text-neon-red">
                                {isFounderPhase ? (
                                    <>
                                        <span className="h-2 w-2 animate-pulse rounded-full bg-neon-red" />
                                        EARLY ACCESS · BE FOUNDER #{founderNumber}
                                    </>
                                ) : (
                                    <>🎮 Join {totalPlayers.toLocaleString()}+ gamers worldwide</>
                                )}
                            </div>
                            <h1 className="mb-6 text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
                                <span className="bg-gradient-to-r from-neon-red via-gaming-pink to-gaming-green bg-clip-text text-transparent">
                                    Find Your Gaming Squad
                                </span>
                            </h1>
                            <p className="mx-auto mb-10 max-w-2xl text-lg text-ink-500 sm:text-xl lg:mx-0">
                                Create LFG groups, find verified teammates, and rate players after every session.
                                Build your reputation and play with gamers you can trust.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                                <Link
                                    href={route('register')}
                                    className="w-full rounded-xl bg-neon-red px-8 py-4 text-lg font-bold text-white shadow-lg shadow-neon-red/25 transition hover:bg-neon-red/80 hover:shadow-neon-red/40 sm:w-auto"
                                >
                                    Get Started Free
                                </Link>
                                <Link
                                    href={route('games.index')}
                                    className="w-full rounded-xl border border-ink-900/10 bg-white px-8 py-4 text-lg font-bold text-ink-900 transition hover:border-ink-900/20 hover:bg-bone-100 sm:w-auto"
                                >
                                    View Games
                                </Link>
                            </div>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-ink-500 sm:gap-8 lg:justify-start">
                                {isFounderPhase ? (
                                    <span className="font-semibold text-neon-red">{founderSpotsLeft} founder spots left</span>
                                ) : (
                                    <span className="font-semibold text-neon-red">{totalPlayers.toLocaleString()} Gamers</span>
                                )}
                                <span className="hidden h-1 w-1 rounded-full bg-gray-600 sm:block" />
                                <span className="font-semibold text-gaming-green">{totalGames} Games</span>
                                {activeLfg > 0 && (
                                    <>
                                        <span className="hidden h-1 w-1 rounded-full bg-gray-600 sm:block" />
                                        <span className="font-semibold text-gaming-pink">{activeLfg} Groups Active</span>
                                    </>
                                )}
                                {onlineNow >= 10 && (
                                    <>
                                        <span className="hidden h-1 w-1 rounded-full bg-gray-600 sm:block" />
                                        <span className="font-semibold text-ink-900">{onlineNow} Online Now</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="hidden flex-1 lg:block">
                            <div className="relative">
                                <div className="grid grid-cols-3 gap-2">
                                    <img src="/images/gamer3.jpg" alt="Gamers playing together" className="col-span-2 h-44 w-full rounded-xl object-cover shadow-lg shadow-ink-900/30" />
                                    <img src="/images/gamer8.jpg" alt="Pro gamer" className="h-44 w-full rounded-xl object-cover shadow-lg shadow-ink-900/30" />
                                    <img src="/images/gamer1.jpg" alt="Mobile gaming" className="h-32 w-full rounded-xl object-cover shadow-lg shadow-ink-900/30" />
                                    <img src="/images/gamer5.jpg" alt="LAN event" className="h-32 w-full rounded-xl object-cover shadow-lg shadow-ink-900/30" />
                                    <img src="/images/gamer4.jpg" alt="Gaming squad" className="h-32 w-full rounded-xl object-cover shadow-lg shadow-ink-900/30" />
                                </div>
                                <div className="absolute -bottom-3 -right-3 rounded-xl border border-neon-red/30 bg-bone-100/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-neon-red" />
                                        <span className="text-sm font-semibold text-ink-900">
                                            {isFounderPhase ? 'Early access · live' : `${onlineNow} online now`}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works - The Loop */}
                <section className="border-y border-ink-900/5 bg-bone-100/30 px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            Find. Play. Rate. <span className="text-neon-red">Repeat.</span>
                        </h2>
                        <p className="mx-auto mb-16 max-w-xl text-center text-ink-500">
                            The SquadSpawn loop: find teammates, play together, rate each other. Every session builds your reputation.
                        </p>

                        {/* 4 Steps as connected cards */}
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Step 1 */}
                            <div className="group relative overflow-hidden rounded-2xl border border-ink-900/10 bg-white transition hover:border-neon-red/40">
                                <div className="relative h-40 overflow-hidden">
                                    <img src="/images/gamer1.jpg" alt="" className="h-full w-full object-cover opacity-60 transition group-hover:scale-105 group-hover:opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-bone-100/40 to-transparent" />
                                    <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-neon-red text-sm font-bold text-white">1</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="mb-2 text-lg font-bold text-ink-900">Create Your Profile</h3>
                                    <p className="text-sm text-ink-500">Add your games, ranks, and playstyle. Show the community who you are as a gamer.</p>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="group relative overflow-hidden rounded-2xl border border-ink-900/10 bg-white transition hover:border-gaming-green/40">
                                <div className="relative h-40 overflow-hidden">
                                    <img src="/images/gamer5.jpg" alt="" className="h-full w-full object-cover opacity-60 transition group-hover:scale-105 group-hover:opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-bone-100/40 to-transparent" />
                                    <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gaming-green text-sm font-bold text-ink-900">2</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="mb-2 text-lg font-bold text-ink-900">Create or Join LFG</h3>
                                    <p className="text-sm text-ink-500">Post a Looking for Group or join someone's squad. Set requirements like rank, mic, and platform.</p>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="group relative overflow-hidden rounded-2xl border border-ink-900/10 bg-white transition hover:border-gaming-pink/40">
                                <div className="relative h-40 overflow-hidden">
                                    <img src="/images/gamer3.jpg" alt="" className="h-full w-full object-cover opacity-60 transition group-hover:scale-105 group-hover:opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-bone-100/40 to-transparent" />
                                    <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-gaming-pink text-sm font-bold text-white">3</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="mb-2 text-lg font-bold text-ink-900">Play Together</h3>
                                    <p className="text-sm text-ink-500">Group chat, Discord voice, coordinated gameplay. Experience what it's like to have a real squad.</p>
                                </div>
                            </div>

                            {/* Step 4 */}
                            <div className="group relative overflow-hidden rounded-2xl border border-ink-900/10 bg-white transition hover:border-yellow-400/40">
                                <div className="relative h-40 overflow-hidden">
                                    <img src="/images/gamer7.jpg" alt="" className="h-full w-full object-cover opacity-60 transition group-hover:scale-105 group-hover:opacity-80" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-white via-bone-100/40 to-transparent" />
                                    <div className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-sm font-bold text-ink-900">4</div>
                                </div>
                                <div className="p-5">
                                    <h3 className="mb-2 text-lg font-bold text-ink-900">Rate & Build Rep</h3>
                                    <p className="text-sm text-ink-500">Rate your teammates after every session. Build your reputation so others know you're a great player.</p>
                                </div>
                            </div>
                        </div>

                        {/* Connecting arrow */}
                        <div className="mt-8 flex items-center justify-center gap-3">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neon-red/30 to-transparent" />
                            <span className="text-sm font-medium text-neon-red">The cycle continues - every game makes you a more trusted player</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-neon-red/30 to-transparent" />
                        </div>
                    </div>
                </section>

                {/* How Reputation Works */}
                <section className="relative overflow-hidden px-6 py-24 lg:px-12">
                    <div className="pointer-events-none absolute inset-0">
                        <img src="/images/gamer8.jpg" alt="" className="h-full w-full object-cover opacity-10" />
                        <div className="absolute inset-0 bg-gradient-to-b from-bone-50 via-bone-50/95 to-bone-50" />
                    </div>
                    <div className="relative z-10 mx-auto max-w-6xl">
                        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
                            <div className="flex-1 text-center lg:text-left">
                                <div className="mb-4 inline-block rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-1.5 text-sm font-medium text-yellow-400">
                                    Reputation System
                                </div>
                                <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
                                    Know Who You're <span className="text-yellow-400">Playing With</span>
                                </h2>
                                <p className="mb-8 text-ink-500 leading-relaxed">
                                    Every player on SquadSpawn has a reputation score built from real teammate ratings.
                                    No more guessing if someone is toxic, a no-show, or an amazing teammate.
                                    Check their score before you squad up.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gaming-green/20">
                                            <svg className="h-5 w-5 text-gaming-green" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-ink-900">Star Ratings (1-5)</h4>
                                            <p className="text-sm text-ink-500">After every LFG session, players rate each other. Your score reflects how you are as a teammate.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neon-red/20">
                                            <svg className="h-5 w-5 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-ink-900">Skill Tags</h4>
                                            <p className="text-sm text-ink-500">"Great Teammate", "Good Comms", "Skilled" - or warnings like "Toxic" and "No Show". Tags show what kind of player someone is.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gaming-pink/20">
                                            <svg className="h-5 w-5 text-gaming-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-ink-900">Trust Score</h4>
                                            <p className="text-sm text-ink-500">The more you play and get rated, the more reliable your score becomes. High-rep players are trusted by the community.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Visual: fake player card */}
                            <div className="flex-1">
                                <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-2xl shadow-neon-red/10">
                                    <div className="relative h-24 overflow-hidden">
                                        <img src="/images/gamer6.jpg" alt="" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                                    </div>
                                    <div className="px-6 pb-6">
                                        <div className="-mt-8 flex items-end gap-4">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-4 border-ink-800 bg-neon-red/20 text-2xl font-bold text-neon-red shadow-lg">P</div>
                                            <div className="pb-1">
                                                <p className="text-lg font-bold text-ink-900">ProGamer_99</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="rounded-full bg-gaming-green/20 px-2 py-0.5 text-[10px] font-semibold text-gaming-green">Ranked</span>
                                                    <span className="text-xs text-gray-500">Europe</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid grid-cols-3 gap-2">
                                            <div className="rounded-lg bg-bone-50 p-2.5 text-center">
                                                <p className="text-lg font-bold text-yellow-400">4.8<span className="ml-0.5 text-xs">&#9733;</span></p>
                                                <p className="text-[9px] text-gray-500">Reputation</p>
                                            </div>
                                            <div className="rounded-lg bg-bone-50 p-2.5 text-center">
                                                <p className="text-lg font-bold text-gaming-green">47</p>
                                                <p className="text-[9px] text-gray-500">Ratings</p>
                                            </div>
                                            <div className="rounded-lg bg-bone-50 p-2.5 text-center">
                                                <p className="text-lg font-bold text-neon-red">12</p>
                                                <p className="text-[9px] text-gray-500">Friends</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            <span className="rounded-full bg-gaming-green/15 px-2.5 py-1 text-[11px] font-medium text-gaming-green">Great Teammate (23)</span>
                                            <span className="rounded-full bg-gaming-cyan/15 px-2.5 py-1 text-[11px] font-medium text-gaming-cyan">Good Comms (15)</span>
                                            <span className="rounded-full bg-neon-red/15 px-2.5 py-1 text-[11px] font-medium text-neon-red">Skilled (9)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Platform Features */}
                <section className="px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            Everything Gamers Need
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-center text-ink-500">
                            Find teammates, play together, build your reputation. All in one platform.
                        </p>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Find Players */}
                            <div className="group rounded-xl border border-ink-900/10 bg-white p-6 transition hover:border-neon-red/50 hover:shadow-lg hover:shadow-neon-red/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neon-red/20">
                                    <svg className="h-6 w-6 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Find Players</h3>
                                <p className="text-sm text-ink-500">Discover gamers by game, rank, and region. Filter by playstyle and availability to find your ideal teammates.</p>
                            </div>

                            {/* Friend Requests */}
                            <div className="group rounded-xl border border-ink-900/10 bg-white p-6 transition hover:border-neon-red/50 hover:shadow-lg hover:shadow-neon-red/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-pink/20">
                                    <svg className="h-6 w-6 text-gaming-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Friend Requests</h3>
                                <p className="text-sm text-ink-500">See who wants to play with you and accept instantly. Build your friends list with gamers who share your vibe.</p>
                            </div>

                            {/* Looking for Group */}
                            <div className="group rounded-xl border border-ink-900/10 bg-white p-6 transition hover:border-neon-red/50 hover:shadow-lg hover:shadow-neon-red/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-green/20">
                                    <svg className="h-6 w-6 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Looking for Group</h3>
                                <p className="text-sm text-ink-500">Create or join game sessions with specific requirements. Set rank, region, and player count to fill your squad.</p>
                            </div>

                            {/* Group Chat */}
                            <div className="group rounded-xl border border-ink-900/10 bg-white p-6 transition hover:border-neon-red/50 hover:shadow-lg hover:shadow-neon-red/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-neon-red/20">
                                    <svg className="h-6 w-6 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Group Chat</h3>
                                <p className="text-sm text-ink-500">Chat with friends and LFG groups in real-time. Coordinate sessions, share strats, and stay connected.</p>
                            </div>

                            {/* Gaming Clips */}
                            <div className="group rounded-xl border border-ink-900/10 bg-white p-6 transition hover:border-neon-red/50 hover:shadow-lg hover:shadow-neon-red/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-pink/20">
                                    <svg className="h-6 w-6 text-gaming-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Gaming Clips</h3>
                                <p className="text-sm text-ink-500">Share your best moments from YouTube, Twitch, and TikTok. Show off highlights and clutch plays to your crew.</p>
                            </div>

                            {/* Creator Profiles */}
                            <div className="group rounded-xl border border-ink-900/10 bg-white p-6 transition hover:border-neon-red/50 hover:shadow-lg hover:shadow-neon-red/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-green/20">
                                    <svg className="h-6 w-6 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Creator Profiles</h3>
                                <p className="text-sm text-ink-500">Showcase your stream and build your audience. Let other gamers discover your content and grow together.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Popular Games */}
                <section className="border-y border-ink-900/5 bg-bone-100/30 px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            Popular Games
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-center text-ink-500">
                            Find teammates across the most popular games with live player counts.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {topGames.slice(0, 8).map((game) => (
                                <Link
                                    key={game.id}
                                    href={user ? `/discover?game_id=${game.id}` : `/players?game_id=${game.id}`}
                                    className="group overflow-hidden rounded-xl border border-ink-900/10 bg-white transition hover:border-neon-red/40 hover:shadow-lg hover:shadow-neon-red/10"
                                >
                                    <div className="relative aspect-[3/2] overflow-hidden">
                                        <img
                                            src={game.cover_image || '/images/games/default.jpg'}
                                            alt={game.name}
                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                        />
                                        <div className="absolute right-2 top-2 rounded-full bg-gaming-green/90 px-2.5 py-0.5 text-xs font-bold text-ink-900">
                                            {game.users_count} players
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-ink-900">{game.name}</h3>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs text-ink-500">{game.genre}</span>
                                            {game.platforms.map((p: string) => (
                                                <span key={p} className="rounded-full bg-neon-red/10 px-2 py-0.5 text-[10px] font-medium text-neon-red">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-10 text-center">
                            <Link
                                href="/games"
                                className="inline-flex items-center gap-2 text-neon-red transition hover:text-neon-red/80"
                            >
                                <span className="font-semibold">View All Games</span>
                                <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Recently Joined */}
                <section className="px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl text-center">
                        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                            Recently Joined
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-ink-500">
                            New gamers are joining every day. Here are some of the latest members.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            {recentPlayers.map((player) => (
                                <div key={player.id} className="flex flex-col items-center gap-2">
                                    <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-neon-red/40 bg-bone-100">
                                        {player.avatar ? (
                                            <img
                                                src={player.avatar}
                                                alt={player.username}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neon-red">
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="max-w-[80px] truncate text-xs text-ink-500">{player.username}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10">
                            <Link
                                href={route('register')}
                                className="inline-flex items-center gap-2 rounded-xl bg-neon-red px-6 py-3 font-bold text-white transition hover:bg-neon-red/80"
                            >
                                <span>Join them</span>
                                <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* A Global Gaming Community */}
                <section className="relative border-y border-ink-900/5 overflow-hidden px-6 py-24 lg:px-12">
                    <div className="pointer-events-none absolute inset-0">
                        <img src="/images/gamer2.jpg" alt="" className="h-full w-full object-cover opacity-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-bone-50 via-bone-50/95 to-bone-50" />
                    </div>
                    <div className="relative z-10 mx-auto max-w-6xl">
                        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
                            <div className="flex-1 text-center lg:text-left">
                                <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                                    A <span className="text-neon-red">Global</span> Gaming Community
                                </h2>
                                <p className="mb-8 max-w-xl text-ink-500">
                                    Connecting gamers worldwide. No matter where you are, your next teammate is just a click away.
                                </p>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-xl border border-ink-900/10 bg-bone-100/80 p-5 backdrop-blur-sm">
                                        {isFounderPhase ? (
                                            <>
                                                <p className="text-3xl font-bold text-neon-red">#{founderNumber}</p>
                                                <p className="mt-1 text-sm text-ink-500">Your founder number</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-3xl font-bold text-neon-red">{totalPlayers.toLocaleString()}+</p>
                                                <p className="mt-1 text-sm text-ink-500">Gamers</p>
                                            </>
                                        )}
                                    </div>
                                    <div className="rounded-xl border border-ink-900/10 bg-bone-100/80 p-5 backdrop-blur-sm">
                                        <p className="text-3xl font-bold text-gaming-green">{totalGames}</p>
                                        <p className="mt-1 text-sm text-ink-500">Games</p>
                                    </div>
                                    <div className="rounded-xl border border-ink-900/10 bg-bone-100/80 p-5 backdrop-blur-sm">
                                        <p className="text-3xl font-bold text-gaming-pink">{activeLfg}</p>
                                        <p className="mt-1 text-sm text-ink-500">Groups Active</p>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden flex-1 lg:block">
                                <img src="/images/gamer2.jpg" alt="Gaming community" className="w-full max-w-sm rounded-2xl border border-ink-900/10 shadow-2xl shadow-neon-red/10 ml-auto" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="relative overflow-hidden px-6 py-24 lg:px-12">
                    <div className="pointer-events-none absolute inset-0">
                        <img src="/images/gamer4.jpg" alt="" className="h-full w-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-b from-bone-50 via-bone-50/80 to-bone-50" />
                    </div>
                    <div className="relative z-10 mx-auto max-w-3xl text-center">
                        <h2 className="mb-6 text-4xl font-extrabold sm:text-5xl">
                            Ready to Build Your Reputation?
                        </h2>
                        <p className="mb-10 text-lg text-ink-500">
                            {isFounderPhase
                                ? `Claim one of the first ${FOUNDER_CAP} founding spots. Shape the platform, build the first squads, and earn a permanent Founder badge on your profile.`
                                : `Join ${totalPlayers.toLocaleString()}+ gamers who play, rate, and build trust together. Your next great teammate is one session away.`}
                        </p>
                        <Link
                            href={route('register')}
                            className="inline-block rounded-xl bg-gaming-green px-10 py-4 text-lg font-bold text-ink-900 shadow-lg shadow-gaming-green/25 transition hover:bg-gaming-green/90"
                        >
                            Create Your Profile
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-ink-900/10 bg-bone-100/30 px-6 pt-16 pb-8 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Brand */}
                            <div>
                                <span className="text-xl font-bold text-neon-red">SquadSpawn</span>
                                <p className="mt-3 text-sm leading-relaxed text-ink-500">
                                    Find your squad, play together, and build your reputation. The trusted platform for gamers worldwide.
                                </p>
                            </div>

                            {/* Platform */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-700">Platform</h4>
                                <ul className="space-y-2 text-sm text-ink-500">
                                    <li><Link href={route('games.index')} className="transition hover:text-ink-900">Games</Link></li>
                                    <li><Link href={route('register')} className="transition hover:text-ink-900">Sign Up</Link></li>
                                    <li><Link href={route('login')} className="transition hover:text-ink-900">Log In</Link></li>
                                </ul>
                            </div>

                            {/* Legal */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-700">Legal</h4>
                                <ul className="space-y-2 text-sm text-ink-500">
                                    <li><a href="/privacy-policy" className="transition hover:text-ink-900">Privacy Policy</a></li>
                                    <li><a href="/terms-of-service" className="transition hover:text-ink-900">Terms of Service</a></li>
                                    <li><a href="/cookie-policy" className="transition hover:text-ink-900">Cookie Policy</a></li>
                                </ul>
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-700">Contact</h4>
                                <ul className="space-y-2 text-sm text-ink-500">
                                    <li><a href="mailto:info@squadspawn.com" className="transition hover:text-ink-900">info@squadspawn.com</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-900/10 pt-8 sm:flex-row">
                            <p className="text-sm text-gray-500">
                                &copy; {new Date().getFullYear()} SquadSpawn. All rights reserved.
                            </p>
                            <p className="text-sm text-gray-500">
                                Built by{' '}
                                <a href="https://budgetpixels.nl" target="_blank" rel="noopener noreferrer" className="text-neon-red transition hover:text-neon-red/80">
                                    BudgetPixels.nl
                                </a>
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
