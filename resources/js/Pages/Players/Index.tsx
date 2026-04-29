import SeoHead from '@/Components/SeoHead';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';

export default function PlayersIndex({
    players,
    games,
    filters,
}: {
    players: { data: User[]; links: any; current_page: number; last_page: number };
    games: Game[];
    filters: { game_id?: string; region?: string };
}) {
    const { auth } = usePage<PageProps>().props;

    const handleFilter = (key: string, value: string) => {
        router.get(route('players.public'), { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const regions = [
        'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam',
        'Netherlands', 'Germany', 'United Kingdom', 'France', 'United States', 'Canada',
        'Japan', 'South Korea', 'Brazil', 'Australia',
    ];

    const content = (
        <>
            <SeoHead fallbackTitle="Browse Players" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-ink-900">Browse Players</h1>
                        <p className="mt-2 text-ink-500">Find gamers to team up with</p>
                    </div>

                    {/* Filters */}
                    <div className="mb-8 flex flex-wrap justify-center gap-3">
                        <select
                            value={filters.game_id || ''}
                            onChange={(e) => handleFilter('game_id', e.target.value)}
                            className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                        >
                            <option value="">All Games</option>
                            {games.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                        <select
                            value={filters.region || ''}
                            onChange={(e) => handleFilter('region', e.target.value)}
                            className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                        >
                            <option value="">All Regions</option>
                            {regions.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* Players grid */}
                    {players.data.length === 0 ? (
                        <div className="rounded-xl border border-ink-900/10 bg-white p-12 text-center">
                            <p className="text-lg font-medium text-ink-500">No players found</p>
                            <p className="mt-2 text-sm text-gray-500">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {players.data.map((player) => (
                                <Link
                                    key={player.id}
                                    href={route('player.show', { username: player.profile?.username || player.id })}
                                    className="group rounded-xl border border-ink-900/10 bg-white p-5 transition hover:border-neon-red/40"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-neon-red to-neon-red-deep font-bold text-white">
                                            {player.profile?.avatar ? (
                                                <img src={player.profile.avatar} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                (player.profile?.username?.[0] || player.name[0]).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-ink-900 group-hover:text-neon-red">
                                                {player.profile?.username || player.name}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                {player.profile?.region && (
                                                    <span className="text-xs text-gray-500">{player.profile.region}</span>
                                                )}
                                                {player.profile?.looking_for && (
                                                    <span className="rounded-full bg-neon-red/10 px-1.5 py-0.5 text-[10px] text-neon-red">
                                                        {player.profile.looking_for}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Games */}
                                    {player.games && player.games.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {player.games.slice(0, 3).map((game) => (
                                                <div key={game.id} className="flex items-center gap-1 rounded-md bg-bone-50 px-2 py-1">
                                                    <img
                                                        src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                        alt=""
                                                        className="h-4 w-6 rounded-sm object-cover"
                                                    />
                                                    <span className="text-[10px] text-ink-500">{game.name.split(':')[0].split(' ').slice(0, 2).join(' ')}</span>
                                                </div>
                                            ))}
                                            {player.games.length > 3 && (
                                                <span className="rounded-md bg-bone-50 px-2 py-1 text-[10px] text-gray-500">
                                                    +{player.games.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {players.last_page > 1 && (
                        <div className="mt-8 flex justify-center gap-2">
                            {Array.from({ length: players.last_page }, (_, i) => i + 1).map((page) => (
                                <Link
                                    key={page}
                                    href={route('players.public', { ...filters, page })}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                        page === players.current_page
                                            ? 'bg-neon-red text-white'
                                            : 'bg-white text-ink-500 hover:text-ink-900'
                                    }`}
                                >
                                    {page}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* CTA for guests */}
                    {!auth?.user && (
                        <div className="mt-12 rounded-xl border border-neon-red/20 bg-neon-red/5 p-8 text-center">
                            <h3 className="text-xl font-bold text-ink-900">Want to connect with these players?</h3>
                            <p className="mt-2 text-ink-500">Create a free account to like, match, and chat with gamers.</p>
                            <Link
                                href={route('register')}
                                className="mt-4 inline-block rounded-xl bg-neon-red px-6 py-3 font-bold text-white transition hover:bg-neon-red/80"
                            >
                                Sign Up Free
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    if (auth?.user) {
        return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
    }

    return (
        <div className="min-h-screen bg-bone-50 text-ink-900">
            <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                <div className="flex items-center gap-4">
                    <Link href={route('login')} className="text-sm text-ink-700 hover:text-ink-900">Log in</Link>
                    <Link href={route('register')} className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white">Sign up</Link>
                </div>
            </nav>
            {content}
        </div>
    );
}
