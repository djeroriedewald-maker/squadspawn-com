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
            <Head title="Find Your Squad" />

            <div className="min-h-screen bg-navy-900 text-white">
                {/* Nav */}
                <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
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
                <section className="relative overflow-hidden px-6 pb-20 pt-12 lg:px-12 lg:pt-20">
                    {/* Hero background image */}
                    <div className="pointer-events-none absolute inset-0">
                        <img
                            src="/images/hero.jpg"
                            alt=""
                            className="h-full w-full object-cover object-top opacity-30"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/80 to-navy-900/40" />
                    </div>

                    <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
                        {/* Text */}
                        <div className="flex-1 text-center lg:text-left">
                            <h1 className="mb-6 text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
                                <span className="bg-gradient-to-r from-gaming-purple via-gaming-pink to-gaming-green bg-clip-text text-transparent">
                                    Find Your Squad
                                </span>
                            </h1>
                            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-400 sm:text-xl lg:mx-0">
                                The premier matchmaking platform for SEA gamers. Connect with
                                teammates who match your playstyle, rank, and schedule. From
                                casual sessions to competitive grinding.
                            </p>
                            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                                {canRegister && (
                                    <Link
                                        href={route('register')}
                                        className="w-full rounded-xl bg-gaming-purple px-8 py-4 text-lg font-bold text-white shadow-lg shadow-gaming-purple/25 transition hover:bg-gaming-purple/80 hover:shadow-gaming-purple/40 sm:w-auto"
                                    >
                                        Get Started
                                    </Link>
                                )}
                                <Link
                                    href={route('login')}
                                    className="w-full rounded-xl border border-white/10 bg-navy-800 px-8 py-4 text-lg font-bold text-white transition hover:border-white/20 hover:bg-navy-700 sm:w-auto"
                                >
                                    Browse Players
                                </Link>
                            </div>
                        </div>

                        {/* Hero image */}
                        <div className="hidden flex-1 lg:block">
                            <img
                                src="/images/hero.jpg"
                                alt="Gamers finding their squad on SquadSpawn"
                                className="rounded-2xl shadow-2xl shadow-gaming-purple/20"
                            />
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="px-6 py-20 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            How It Works
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-center text-gray-400">
                            SquadSpawn makes finding your perfect gaming partners effortless.
                        </p>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <FeatureCard
                                icon={
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                }
                                title="Find Players"
                                description="Browse through players who share your games, rank, and region. Filter by game, role, and playstyle."
                            />
                            <FeatureCard
                                icon={
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                    </svg>
                                }
                                title="Match System"
                                description="Like players you want to team up with. When both of you match, you're connected instantly."
                            />
                            <FeatureCard
                                icon={
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                    </svg>
                                }
                                title="Real-time Chat"
                                description="Chat with your matches to coordinate games, plan strategies, and build lasting friendships."
                            />
                            <FeatureCard
                                icon={
                                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                                    </svg>
                                }
                                title="Cross-Game"
                                description="Support for Valorant, Dota 2, Mobile Legends, and more. One profile, all your games."
                            />
                        </div>
                    </div>
                </section>

                {/* Games Section */}
                <section className="px-6 py-20 lg:px-12">
                    <div className="mx-auto max-w-6xl">
                        <h2 className="mb-4 text-center text-3xl font-bold sm:text-4xl">
                            Popular Games
                        </h2>
                        <p className="mx-auto mb-12 max-w-xl text-center text-gray-400">
                            Find teammates across the most popular mobile and PC games in Southeast Asia.
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { name: 'Mobile Legends', genre: 'MOBA', image: '/images/games/mlbb.svg', platform: 'Mobile' },
                                { name: 'PUBG Mobile', genre: 'Battle Royale', image: '/images/games/pubgm.svg', platform: 'Mobile' },
                                { name: 'Valorant', genre: 'Tactical Shooter', image: '/images/games/valorant.svg', platform: 'PC' },
                                { name: 'League of Legends', genre: 'MOBA', image: '/images/games/lol.svg', platform: 'PC' },
                                { name: 'Free Fire', genre: 'Battle Royale', image: '/images/games/freefire.svg', platform: 'Mobile' },
                                { name: 'Honor of Kings', genre: 'MOBA', image: '/images/games/hok.svg', platform: 'Mobile' },
                                { name: 'Call of Duty: Mobile', genre: 'FPS', image: '/images/games/codm.svg', platform: 'Mobile' },
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

                {/* Footer */}
                <footer className="border-t border-white/10 px-6 py-12 lg:px-12">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
                        <span className="text-lg font-bold text-gaming-purple">
                            SquadSpawn
                        </span>
                        <div className="flex gap-6 text-sm text-gray-400">
                            <a href="#" className="transition hover:text-white">About</a>
                            <a href="#" className="transition hover:text-white">Contact</a>
                            <a href="#" className="transition hover:text-white">Privacy</a>
                            <a href="#" className="transition hover:text-white">Terms</a>
                        </div>
                        <p className="text-sm text-gray-500">
                            Built for SEA Gamers
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/30">
            <div className="mb-4 text-gaming-purple">{icon}</div>
            <h3 className="mb-2 text-lg font-semibold">{title}</h3>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
    );
}
