import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome({
    canLogin,
    canRegister,
}: {
    canLogin: boolean;
    canRegister: boolean;
    laravelVersion: string;
    phpVersion: string;
}) {
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

                {/* Hero */}
                <section className="relative overflow-hidden px-6 pb-24 pt-12 lg:px-12 lg:pt-20">
                    <div className="pointer-events-none absolute inset-0">
                        <img src="/images/hero.jpg" alt="" className="h-full w-full object-cover object-top opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/80 to-navy-900/40" />
                    </div>

                    <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="mb-4 inline-block rounded-full border border-gaming-purple/30 bg-gaming-purple/10 px-4 py-1.5 text-sm font-medium text-gaming-purple">
                                #1 Gaming Matchmaking Platform
                            </div>
                            <h1 className="mb-6 text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
                                <span className="bg-gradient-to-r from-gaming-purple via-gaming-pink to-gaming-green bg-clip-text text-transparent">
                                    Find Your Squad
                                </span>
                            </h1>
                            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl lg:mx-0">
                                The premier matchmaking platform for gamers worldwide. Connect with
                                teammates who match your playstyle, rank, and schedule.
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
                                    Browse Games
                                </Link>
                            </div>
                            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500 lg:justify-start">
                                <span>7+ Games</span>
                                <span className="h-1 w-1 rounded-full bg-gray-600" />
                                <span>Free to Join</span>
                                <span className="h-1 w-1 rounded-full bg-gray-600" />
                                <span>All Regions</span>
                            </div>
                        </div>

                        <div className="hidden flex-1 lg:block">
                            <img
                                src="/images/hero.jpg"
                                alt="Gamers finding their squad"
                                className="rounded-2xl shadow-2xl shadow-gaming-purple/20"
                            />
                        </div>
                    </div>
                </section>

                {/* How It Works - with images */}
                <section className="border-y border-white/5 bg-navy-800/30 px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            How It Works
                        </h2>
                        <p className="mx-auto mb-16 max-w-xl text-center text-gray-400">
                            Three simple steps to find your perfect gaming squad.
                        </p>

                        {/* Step 1 - Discover */}
                        <div className="mb-20 flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
                            <div className="flex-1">
                                <img src="/images/matchmaking.svg" alt="Discover players" className="mx-auto w-full max-w-md" />
                            </div>
                            <div className="flex-1 text-center lg:text-left">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gaming-purple text-lg font-bold">1</div>
                                <h3 className="mb-4 text-2xl font-bold">Discover Players</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Browse through player profiles filtered by your favorite games, rank, and region.
                                    See their playstyle, availability, and what they're looking for. Like the ones you
                                    want to play with — pass on the rest.
                                </p>
                            </div>
                        </div>

                        {/* Step 2 - Match */}
                        <div className="mb-20 flex flex-col items-center gap-10 lg:flex-row-reverse lg:gap-16">
                            <div className="flex-1">
                                <img src="/images/leaderboard.svg" alt="Match and compete" className="mx-auto w-full max-w-md" />
                            </div>
                            <div className="flex-1 text-center lg:text-left">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gaming-green text-lg font-bold text-navy-900">2</div>
                                <h3 className="mb-4 text-2xl font-bold">Match by Rank</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    When both of you like each other — it's a match! Find players at your skill level,
                                    from Iron to Radiant, from Warrior to Mythic. No more carrying or getting carried.
                                </p>
                            </div>
                        </div>

                        {/* Step 3 - Chat */}
                        <div className="flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
                            <div className="flex-1">
                                <img src="/images/squad-chat.svg" alt="Team chat" className="mx-auto w-full max-w-md" />
                            </div>
                            <div className="flex-1 text-center lg:text-left">
                                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gaming-pink text-lg font-bold">3</div>
                                <h3 className="mb-4 text-2xl font-bold">Chat & Play</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Start chatting with your matches instantly. Coordinate game sessions,
                                    share strategies, and build a squad that grows together. From solo queue
                                    to five-stack — your team awaits.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Games Section */}
                <section className="px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            Popular Games
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-center text-gray-400">
                            Find teammates across the most popular mobile and PC games worldwide.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { name: 'Mobile Legends', genre: 'MOBA', image: '/images/games/mlbb.jpg', platform: 'Mobile' },
                                { name: 'PUBG Mobile', genre: 'Battle Royale', image: '/images/games/pubgm.jpg', platform: 'Mobile' },
                                { name: 'Valorant', genre: 'Tactical Shooter', image: '/images/games/valorant.jpg', platform: 'PC' },
                                { name: 'League of Legends', genre: 'MOBA', image: '/images/games/lol.jpg', platform: 'PC' },
                                { name: 'Free Fire', genre: 'Battle Royale', image: '/images/games/freefire.jpg', platform: 'Mobile' },
                                { name: 'Honor of Kings', genre: 'MOBA', image: '/images/games/hok.jpg', platform: 'Mobile' },
                                { name: 'Call of Duty: Mobile', genre: 'FPS', image: '/images/games/codm.jpg', platform: 'Mobile' },
                            ].map((game) => (
                                <div
                                    key={game.name}
                                    className="group overflow-hidden rounded-xl border border-white/10 bg-navy-800 transition hover:border-gaming-purple/40 hover:shadow-lg hover:shadow-gaming-purple/10"
                                >
                                    <div className="aspect-[3/2] overflow-hidden">
                                        <img
                                            src={game.image}
                                            alt={game.name}
                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-white">{game.name}</h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{game.genre}</span>
                                            <span className="rounded-full bg-gaming-purple/10 px-2 py-0.5 text-[10px] font-medium text-gaming-purple">{game.platform}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SEA Community */}
                <section className="border-y border-white/5 bg-navy-800/30 px-6 py-24 lg:px-12">
                    <div className="mx-auto max-w-6xl text-center">
                        <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                            A <span className="text-gaming-purple">Global</span> Gaming Community
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-gray-400">
                            Connecting gamers worldwide — from Southeast Asia to Europe, North America and beyond. Find your squad, wherever you are.
                        </p>
                        <img
                            src="/images/regions-map.svg"
                            alt="Global gaming community"
                            className="mx-auto mb-12 w-full max-w-2xl"
                        />
                        <div className="grid gap-6 sm:grid-cols-3">
                            <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                                <p className="text-4xl font-bold text-gaming-purple">Global</p>
                                <p className="mt-2 text-sm text-gray-400">Players Worldwide</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                                <p className="text-4xl font-bold text-gaming-green">7</p>
                                <p className="mt-2 text-sm text-gray-400">Games Supported</p>
                            </div>
                            <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                                <p className="text-4xl font-bold text-gaming-pink">24/7</p>
                                <p className="mt-2 text-sm text-gray-400">Players Online</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="relative overflow-hidden px-6 py-24 lg:px-12">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gaming-purple/15 blur-[120px]" />
                        <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-gaming-green/10 blur-[100px]" />
                    </div>
                    <div className="relative z-10 mx-auto max-w-3xl text-center">
                        <h2 className="mb-6 text-4xl font-extrabold sm:text-5xl">
                            Ready to Find Your Squad?
                        </h2>
                        <p className="mb-10 text-lg text-gray-400">
                            Join thousands of gamers already building their dream teams. It's free, it's fast, and your next teammate is waiting.
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
                <footer className="border-t border-white/10 px-6 py-12 lg:px-12">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
                        <span className="text-lg font-bold text-gaming-purple">
                            SquadSpawn
                        </span>
                        <div className="flex gap-6 text-sm text-gray-400">
                            <Link href={route('games.index')} className="transition hover:text-white">Games</Link>
                            <a href="#" className="transition hover:text-white">About</a>
                            <a href="#" className="transition hover:text-white">Contact</a>
                            <a href="#" className="transition hover:text-white">Privacy</a>
                        </div>
                        <p className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} SquadSpawn. Find Your Squad.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
