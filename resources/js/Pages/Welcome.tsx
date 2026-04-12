import { Head, Link, usePage } from '@inertiajs/react';

const gameCovers = [
    { name: 'Mobile Legends', image: '/images/games/mlbb.jpg' },
    { name: 'Valorant', image: '/images/games/valorant.jpg' },
    { name: 'Fortnite', image: '/images/games/fortnite.jpg' },
    { name: 'League of Legends', image: '/images/games/lol.jpg' },
    { name: 'PUBG Mobile', image: '/images/games/pubgm.jpg' },
    { name: 'Apex Legends', image: '/images/games/apex.jpg' },
    { name: 'Counter-Strike 2', image: '/images/games/cs2.jpg' },
    { name: 'Genshin Impact', image: '/images/games/genshin.svg' },
    { name: 'Overwatch 2', image: '/images/games/overwatch2.jpg' },
    { name: 'Dota 2', image: '/images/games/dota2.jpg' },
    { name: 'Free Fire', image: '/images/games/freefire.jpg' },
    { name: 'Honor of Kings', image: '/images/games/hok.jpg' },
    { name: 'Call of Duty: Mobile', image: '/images/games/codm.jpg' },
    { name: 'Rocket League', image: '/images/games/rocketleague.jpg' },
    { name: 'Minecraft', image: '/images/games/minecraft.png' },
    { name: 'Brawl Stars', image: '/images/games/brawlstars.svg' },
    { name: 'Clash Royale', image: '/images/games/clashroyale.svg' },
    { name: 'Arena of Valor', image: '/images/games/aov.svg' },
    { name: 'Stumble Guys', image: '/images/games/stumbleguys.jpg' },
];

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
                                <span>19+ Games</span>
                                <span className="h-1 w-1 rounded-full bg-gray-600" />
                                <span>Free to Join</span>
                                <span className="h-1 w-1 rounded-full bg-gray-600" />
                                <span>All Regions</span>
                            </div>
                        </div>

                        <div className="hidden flex-1 lg:block">
                            <div className="grid grid-cols-2 gap-3">
                                {gameCovers.slice(0, 4).map((game, i) => (
                                    <img
                                        key={game.name}
                                        src={game.image}
                                        alt={game.name}
                                        className={`rounded-xl object-cover shadow-lg shadow-black/30 transition hover:scale-105 ${
                                            i === 0 ? 'col-span-2 h-48' : 'h-32'
                                        } w-full`}
                                    />
                                ))}
                            </div>
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
                                { name: 'Valorant', genre: 'Tactical Shooter', image: '/images/games/valorant.jpg', platforms: ['PC', 'Console'] },
                                { name: 'Fortnite', genre: 'Battle Royale', image: '/images/games/fortnite.jpg', platforms: ['PC', 'Console', 'Mobile'] },
                                { name: 'League of Legends', genre: 'MOBA', image: '/images/games/lol.jpg', platforms: ['PC'] },
                                { name: 'Apex Legends', genre: 'Battle Royale', image: '/images/games/apex.jpg', platforms: ['PC', 'Console'] },
                                { name: 'Counter-Strike 2', genre: 'Tactical Shooter', image: '/images/games/cs2.jpg', platforms: ['PC'] },
                                { name: 'Mobile Legends', genre: 'MOBA', image: '/images/games/mlbb.jpg', platforms: ['Mobile'] },
                                { name: 'PUBG Mobile', genre: 'Battle Royale', image: '/images/games/pubgm.jpg', platforms: ['Mobile'] },
                                { name: 'Genshin Impact', genre: 'Action RPG', image: '/images/games/genshin.svg', platforms: ['PC', 'Console', 'Mobile'] },
                                { name: 'Overwatch 2', genre: 'Hero Shooter', image: '/images/games/overwatch2.jpg', platforms: ['PC', 'Console'] },
                                { name: 'Dota 2', genre: 'MOBA', image: '/images/games/dota2.jpg', platforms: ['PC'] },
                                { name: 'Rocket League', genre: 'Sports', image: '/images/games/rocketleague.jpg', platforms: ['PC', 'Console'] },
                                { name: 'Free Fire', genre: 'Battle Royale', image: '/images/games/freefire.jpg', platforms: ['Mobile'] },
                                { name: 'Honor of Kings', genre: 'MOBA', image: '/images/games/hok.jpg', platforms: ['Mobile', 'PC'] },
                                { name: 'Call of Duty: Mobile', genre: 'FPS', image: '/images/games/codm.jpg', platforms: ['Mobile'] },
                                { name: 'Minecraft', genre: 'Sandbox', image: '/images/games/minecraft.png', platforms: ['PC', 'Console', 'Mobile'] },
                                { name: 'Brawl Stars', genre: 'Action', image: '/images/games/brawlstars.svg', platforms: ['Mobile'] },
                                { name: 'Clash Royale', genre: 'Strategy', image: '/images/games/clashroyale.svg', platforms: ['Mobile'] },
                                { name: 'Arena of Valor', genre: 'MOBA', image: '/images/games/aov.svg', platforms: ['Mobile'] },
                                { name: 'Stumble Guys', genre: 'Party', image: '/images/games/stumbleguys.jpg', platforms: ['Mobile', 'PC'] },
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
                                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                            <span className="text-xs text-gray-400">{game.genre}</span>
                                            {game.platforms.map((p: string) => (
                                                <span key={p} className="rounded-full bg-gaming-purple/10 px-2 py-0.5 text-[10px] font-medium text-gaming-purple">{p}</span>
                                            ))}
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
                                <p className="text-4xl font-bold text-gaming-green">19</p>
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
