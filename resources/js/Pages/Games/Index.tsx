import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

interface GameWithCount extends Game {
    users_count: number;
}

export default function GamesIndex({ games }: { games: GameWithCount[] }) {
    const { auth } = usePage<PageProps>().props;

    const content = (
        <>
            <Head title="Games" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-white">Games</h1>
                        <p className="mt-2 text-gray-400">{games.length} games available &middot; Find players for your favorite titles</p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {games.map((game) => (
                            <Link
                                key={game.id}
                                href={auth?.user ? route('discovery.index', { game_id: game.id }) : route('register')}
                                className="group overflow-hidden rounded-xl border border-white/10 bg-navy-800 transition hover:border-gaming-purple/40 hover:shadow-lg hover:shadow-gaming-purple/10"
                            >
                                <div className="relative h-40 overflow-hidden">
                                    <img
                                        src={game.cover_image || `/images/games/${game.slug}.svg`}
                                        alt={game.name}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-navy-800 via-transparent to-transparent" />

                                    {/* Player count badge */}
                                    <div className="absolute right-3 top-3 rounded-lg bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                                        {game.users_count} {game.users_count === 1 ? 'player' : 'players'}
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="text-lg font-bold text-white group-hover:text-gaming-purple">{game.name}</h3>

                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs text-gray-400">{game.genre}</span>
                                        {game.platforms.map((p) => (
                                            <span key={p} className="rounded-full bg-gaming-purple/10 px-2 py-0.5 text-[10px] font-medium capitalize text-gaming-purple">
                                                {p}
                                            </span>
                                        ))}
                                    </div>

                                    {game.rank_system && game.rank_system.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1">
                                            {game.rank_system.slice(0, 5).map((rank) => (
                                                <span key={rank} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-500">{rank}</span>
                                            ))}
                                            {game.rank_system.length > 5 && (
                                                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-gray-500">+{game.rank_system.length - 5}</span>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-4 text-center">
                                        <span className="inline-block rounded-lg bg-gaming-purple/10 px-4 py-1.5 text-xs font-semibold text-gaming-purple transition group-hover:bg-gaming-purple group-hover:text-white">
                                            Find Players
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

    if (auth?.user) {
        return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
    }

    return <div className="min-h-screen bg-navy-900">{content}</div>;
}
