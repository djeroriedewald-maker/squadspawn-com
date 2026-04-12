import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps } from '@/types';
import { Head, usePage } from '@inertiajs/react';

export default function GamesIndex({ games }: { games: Game[] }) {
    const { auth } = usePage<PageProps>().props;

    const content = (
        <>
            <Head title="Games" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h1 className="mb-8 text-3xl font-bold text-white">Games</h1>

                    {games.length === 0 ? (
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-12 text-center">
                            <p className="text-gray-400">No games available yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {games.map((game) => (
                                <div
                                    key={game.id}
                                    className="group rounded-xl border border-white/10 bg-navy-800 p-6 transition hover:border-gaming-purple/30"
                                >
                                    {game.cover_image ? (
                                        <img
                                            src={game.cover_image}
                                            alt={game.name}
                                            className="mb-4 h-40 w-full rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="mb-4 flex h-40 w-full items-center justify-center rounded-lg bg-navy-700">
                                            <span className="text-4xl font-bold text-gaming-purple/30">
                                                {game.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}

                                    <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-gaming-purple">
                                        {game.name}
                                    </h3>

                                    <p className="mb-3 text-sm text-gray-400">{game.genre}</p>

                                    <div className="mb-3 flex flex-wrap gap-2">
                                        {game.platforms.map((platform) => (
                                            <span
                                                key={platform}
                                                className="rounded-full bg-navy-700 px-3 py-1 text-xs font-medium text-gray-300"
                                            >
                                                {platform}
                                            </span>
                                        ))}
                                    </div>

                                    {game.rank_system && game.rank_system.length > 0 && (
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-gray-500">
                                                Ranks
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {game.rank_system.slice(0, 4).join(', ')}
                                                {game.rank_system.length > 4 && '...'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    if (auth?.user) {
        return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
    }

    return <div className="min-h-screen bg-navy-900">{content}</div>;
}
