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

    return (
        <>
            <Head title="Find Your Gaming Squad" />

            <div className="min-h-screen bg-navy-900 text-white">
                {/* Nav */}
                <nav className="relative z-20 flex items-center justify-between px-6 py-4 lg:px-12">
                    <span className="text-2xl font-bold text-gaming-purple">
                        SquadSpawn
                    </span>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-lg bg-gaming-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-gaming-purple/80"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                {canLogin && (
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-medium text-gray-300 transition hover:text-white"
                                    >
                                        Log in
                                    </Link>
                                )}
                                {canRegister && (
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-gaming-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-gaming-purple/80"
                                    >
                                        Sign up
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                </nav>

                {/* Scrolling Game Banner */}
                <div className="relative overflow-hidden border-y border-white/5 bg-navy-800/50 py-3">
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
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-navy-900 to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-navy-900 to-transparent" />
                </div>

                {/* Hero */}
                <section className="relative overflow-hidden px-6 pb-24 pt-16 lg:px-12 lg:pt-24">
                    {/* Game collage background */}
                    <div className="pointer-events-none absolute inset-0 grid grid-cols-4 gap-1 opacity-[0.07]">
                        {[...gameCovers, ...gameCovers, ...gameCovers, ...gameCovers].slice(0, 16).map((game, i) => (
                            <img key={i} src={game.image} alt="" className="h-full w-full object-cover" />
                        ))}
                    </div>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-900/60 via-navy-900/90 to-navy-900" />

                    <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="mb-4 inline-block rounded-full border border-gaming-purple/30 bg-gaming-purple/10 px-4 py-1.5 text-sm font-medium text-gaming-purple">
                                🎮 Join {totalPlayers.toLocaleString()}+ gamers worldwide
                            </div>
                            <h1 className="mb-6 text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
                                <span className="bg-gradient-to-r from-gaming-purple via-gaming-pink to-gaming-green bg-clip-text text-transparent">
                                    Find Your Gaming Squad
                                </span>
                            </h1>
                            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl lg:mx-0">
                                The ultimate platform for finding teammates, creating LFG groups,
                                and sharing your best gaming clips. Connect with players who match
                                your playstyle, rank, and schedule.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                                <Link
                                    href={route('register')}
                                    className="w-full rounded-xl bg-gaming-purple px-8 py-4 text-lg font-bold text-white shadow-lg shadow-gaming-purple/25 transition hover:bg-gaming-purple/80 hover:shadow-gaming-purple/40 sm:w-auto"
                                >
                                    Get Started Free
                                </Link>
                                <Link
                                    href={route('games.index')}
                                    className="w-full rounded-xl border border-white/10 bg-navy-800 px-8 py-4 text-lg font-bold text-white transition hover:border-white/20 hover:bg-navy-700 sm:w-auto"
                                >
                                    View Games
                                </Link>
                            </div>
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 sm:gap-8 lg:justify-start">
                                <span className="font-semibold text-gaming-purple">{totalPlayers.toLocaleString()} Gamers</span>
                                <span className="hidden h-1 w-1 rounded-full bg-gray-600 sm:block" />
                                <span className="font-semibold text-gaming-green">{totalGames} Games</span>
                                <span className="hidden h-1 w-1 rounded-full bg-gray-600 sm:block" />
                                <span className="font-semibold text-gaming-pink">{activeLfg} Groups Active</span>
                                <span className="hidden h-1 w-1 rounded-full bg-gray-600 sm:block" />
                                <span className="font-semibold text-white">{onlineNow} Online Now</span>
                            </div>
                        </div>

                        <div className="hidden flex-1 lg:block">
                            <div className="relative">
                                <div className="grid grid-cols-2 gap-3">
                                    <img src="/images/gamer3.jpg" alt="Gamers playing together" className="col-span-2 h-52 w-full rounded-xl object-cover shadow-lg shadow-black/30" />
                                    <img src="/images/gamer1.jpg" alt="Mobile gaming" className="h-36 w-full rounded-xl object-cover shadow-lg shadow-black/30" />
                                    <img src="/images/gamer4.jpg" alt="Gaming squad" className="h-36 w-full rounded-xl object-cover shadow-lg shadow-black/30" />
                                </div>
                                <div className="absolute -bottom-3 -right-3 rounded-xl border border-gaming-purple/30 bg-navy-800/90 px-4 py-2 shadow-lg backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-gaming-green" />
                                        <span className="text-sm font-semibold text-white">{onlineNow} online now</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="border-y border-white/5 bg-navy-800/30 px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            How It Works
                        </h2>
                        <p className="mx-auto mb-16 max-w-xl text-center text-gray-400">
                            Three simple steps to find your perfect gaming squad.
                        </p>

                        {/* Step 1 - Create Your Profile */}
                        <div className="mb-20 flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
                            <div className="flex-1">
                                <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl">
                                    <img src="/images/gamer1.jpg" alt="Gamer setting up profile" className="w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 rounded-lg bg-gaming-purple/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                        Your gaming identity
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 text-center lg:text-left">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gaming-purple text-lg font-bold">1</div>
                                <h3 className="mb-4 text-2xl font-bold">Create Your Profile</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Set up your gaming identity. Add your games, ranks, and preferred roles.
                                    Link your Discord and socials so teammates can find and connect with you easily.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 - Find Your Squad */}
                        <div className="mb-20 flex flex-col items-center gap-10 lg:flex-row-reverse lg:gap-16">
                            <div className="flex-1">
                                <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl">
                                    <img src="/images/gamer2.jpg" alt="Gaming event with players" className="w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 rounded-lg bg-gaming-green/90 px-3 py-1.5 text-xs font-bold text-navy-900 backdrop-blur-sm">
                                        Discover players worldwide
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 text-center lg:text-left">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gaming-green text-lg font-bold text-navy-900">2</div>
                                <h3 className="mb-4 text-2xl font-bold">Find Your Squad</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Browse players, see who liked you, and join LFG groups. Filter by game,
                                    rank, region, and playstyle to find the perfect teammates for your sessions.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 - Connect & Play */}
                        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
                            <div className="flex-1">
                                <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl">
                                    <img src="/images/gamer3.jpg" alt="Squad gaming together" className="w-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent" />
                                    <div className="absolute bottom-4 left-4 rounded-lg bg-gaming-pink/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                        Squad up and dominate
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 text-center lg:text-left">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gaming-pink text-lg font-bold">3</div>
                                <h3 className="mb-4 text-2xl font-bold">Connect & Play</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Chat with friends, join Discord servers, share clips and highlights.
                                    Build your gaming crew and go from solo queue to a full squad ready to dominate.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Platform Features */}
                <section className="px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            Platform Features
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-center text-gray-400">
                            Everything you need to find teammates and build your gaming community.
                        </p>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {/* Find Players */}
                            <div className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/50 hover:shadow-lg hover:shadow-gaming-purple/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-purple/20">
                                    <svg className="h-6 w-6 text-gaming-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Find Players</h3>
                                <p className="text-sm text-gray-400">Discover gamers by game, rank, and region. Filter by playstyle and availability to find your ideal teammates.</p>
                            </div>

                            {/* Friend Requests */}
                            <div className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/50 hover:shadow-lg hover:shadow-gaming-purple/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-pink/20">
                                    <svg className="h-6 w-6 text-gaming-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Friend Requests</h3>
                                <p className="text-sm text-gray-400">See who wants to play with you and accept instantly. Build your friends list with gamers who share your vibe.</p>
                            </div>

                            {/* Looking for Group */}
                            <div className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/50 hover:shadow-lg hover:shadow-gaming-purple/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-green/20">
                                    <svg className="h-6 w-6 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Looking for Group</h3>
                                <p className="text-sm text-gray-400">Create or join game sessions with specific requirements. Set rank, region, and player count to fill your squad.</p>
                            </div>

                            {/* Group Chat */}
                            <div className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/50 hover:shadow-lg hover:shadow-gaming-purple/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-purple/20">
                                    <svg className="h-6 w-6 text-gaming-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Group Chat</h3>
                                <p className="text-sm text-gray-400">Chat with friends and LFG groups in real-time. Coordinate sessions, share strats, and stay connected.</p>
                            </div>

                            {/* Gaming Clips */}
                            <div className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/50 hover:shadow-lg hover:shadow-gaming-purple/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-pink/20">
                                    <svg className="h-6 w-6 text-gaming-pink" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Gaming Clips</h3>
                                <p className="text-sm text-gray-400">Share your best moments from YouTube, Twitch, and TikTok. Show off highlights and clutch plays to your crew.</p>
                            </div>

                            {/* Creator Profiles */}
                            <div className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/50 hover:shadow-lg hover:shadow-gaming-purple/10">
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gaming-green/20">
                                    <svg className="h-6 w-6 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </div>
                                <h3 className="mb-2 text-lg font-bold">Creator Profiles</h3>
                                <p className="text-sm text-gray-400">Showcase your stream and build your audience. Let other gamers discover your content and grow together.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Popular Games */}
                <section className="border-y border-white/5 bg-navy-800/30 px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            Popular Games
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-center text-gray-400">
                            Find teammates across the most popular games with live player counts.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {topGames.slice(0, 8).map((game) => (
                                <Link
                                    key={game.id}
                                    href={user ? `/discover?game_id=${game.id}` : `/players?game_id=${game.id}`}
                                    className="group overflow-hidden rounded-xl border border-white/10 bg-navy-800 transition hover:border-gaming-purple/40 hover:shadow-lg hover:shadow-gaming-purple/10"
                                >
                                    <div className="relative aspect-[3/2] overflow-hidden">
                                        <img
                                            src={game.cover_image || '/images/games/default.jpg'}
                                            alt={game.name}
                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                        />
                                        <div className="absolute right-2 top-2 rounded-full bg-gaming-green/90 px-2.5 py-0.5 text-xs font-bold text-navy-900">
                                            {game.users_count} players
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-white">{game.name}</h3>
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs text-gray-400">{game.genre}</span>
                                            {game.platforms.map((p: string) => (
                                                <span key={p} className="rounded-full bg-gaming-purple/10 px-2 py-0.5 text-[10px] font-medium text-gaming-purple">{p}</span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-10 text-center">
                            <Link
                                href="/games"
                                className="inline-flex items-center gap-2 text-gaming-purple transition hover:text-gaming-purple/80"
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
                        <p className="mx-auto mb-12 max-w-xl text-gray-400">
                            New gamers are joining every day. Here are some of the latest members.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            {recentPlayers.map((player) => (
                                <div key={player.id} className="flex flex-col items-center gap-2">
                                    <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-gaming-purple/40 bg-navy-700">
                                        {player.avatar ? (
                                            <img
                                                src={player.avatar}
                                                alt={player.username}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gaming-purple">
                                                {player.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <span className="max-w-[80px] truncate text-xs text-gray-400">{player.username}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10">
                            <Link
                                href={route('register')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gaming-purple px-6 py-3 font-bold text-white transition hover:bg-gaming-purple/80"
                            >
                                <span>Join them</span>
                                <span aria-hidden="true">&rarr;</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* A Global Gaming Community */}
                <section className="relative border-y border-white/5 overflow-hidden px-6 py-24 lg:px-12">
                    <div className="pointer-events-none absolute inset-0">
                        <img src="/images/gamer2.jpg" alt="" className="h-full w-full object-cover opacity-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/95 to-navy-900" />
                    </div>
                    <div className="relative z-10 mx-auto max-w-6xl">
                        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
                            <div className="flex-1 text-center lg:text-left">
                                <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                                    A <span className="text-gaming-purple">Global</span> Gaming Community
                                </h2>
                                <p className="mb-8 max-w-xl text-gray-400">
                                    Connecting gamers worldwide. No matter where you are, your next teammate is just a click away.
                                </p>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-xl border border-white/10 bg-navy-800/80 p-5 backdrop-blur-sm">
                                        <p className="text-3xl font-bold text-gaming-purple">{totalPlayers.toLocaleString()}+</p>
                                        <p className="mt-1 text-sm text-gray-400">Gamers</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-navy-800/80 p-5 backdrop-blur-sm">
                                        <p className="text-3xl font-bold text-gaming-green">{totalGames}</p>
                                        <p className="mt-1 text-sm text-gray-400">Games</p>
                                    </div>
                                    <div className="rounded-xl border border-white/10 bg-navy-800/80 p-5 backdrop-blur-sm">
                                        <p className="text-3xl font-bold text-gaming-pink">{activeLfg}</p>
                                        <p className="mt-1 text-sm text-gray-400">Groups Active</p>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden flex-1 lg:block">
                                <img src="/images/gamer2.jpg" alt="Gaming community" className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl shadow-gaming-purple/10 ml-auto" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="relative overflow-hidden px-6 py-24 lg:px-12">
                    <div className="pointer-events-none absolute inset-0">
                        <img src="/images/gamer4.jpg" alt="" className="h-full w-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-900/80 to-navy-900" />
                    </div>
                    <div className="relative z-10 mx-auto max-w-3xl text-center">
                        <h2 className="mb-6 text-4xl font-extrabold sm:text-5xl">
                            Ready to Find Your Squad?
                        </h2>
                        <p className="mb-10 text-lg text-gray-400">
                            Join {totalPlayers.toLocaleString()}+ gamers already building their dream teams. It's free, it's fast, and your next teammate is waiting.
                        </p>
                        <Link
                            href={route('register')}
                            className="inline-block rounded-xl bg-gaming-green px-10 py-4 text-lg font-bold text-navy-900 shadow-lg shadow-gaming-green/25 transition hover:bg-gaming-green/90"
                        >
                            Create Your Profile
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-white/10 bg-navy-800/30 px-6 pt-16 pb-8 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Brand */}
                            <div>
                                <span className="text-xl font-bold text-gaming-purple">SquadSpawn</span>
                                <p className="mt-3 text-sm leading-relaxed text-gray-400">
                                    The premier matchmaking platform for gamers. Find your squad, wherever you are.
                                </p>
                            </div>

                            {/* Platform */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">Platform</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><Link href={route('games.index')} className="transition hover:text-white">Games</Link></li>
                                    <li><Link href={route('register')} className="transition hover:text-white">Sign Up</Link></li>
                                    <li><Link href={route('login')} className="transition hover:text-white">Log In</Link></li>
                                </ul>
                            </div>

                            {/* Legal */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">Legal</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><a href="/privacy-policy" className="transition hover:text-white">Privacy Policy</a></li>
                                    <li><a href="/terms-of-service" className="transition hover:text-white">Terms of Service</a></li>
                                    <li><a href="/cookie-policy" className="transition hover:text-white">Cookie Policy</a></li>
                                </ul>
                            </div>

                            {/* Contact */}
                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-300">Contact</h4>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li><a href="mailto:info@squadspawn.com" className="transition hover:text-white">info@squadspawn.com</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                            <p className="text-sm text-gray-500">
                                &copy; {new Date().getFullYear()} SquadSpawn. All rights reserved.
                            </p>
                            <p className="text-sm text-gray-500">
                                Built by{' '}
                                <a href="https://budgetpixels.nl" target="_blank" rel="noopener noreferrer" className="text-gaming-purple transition hover:text-gaming-purple/80">
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
