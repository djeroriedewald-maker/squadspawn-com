import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

export default function Passed({ players: initialPlayers }: PageProps<{ players: (User & { common_game_count?: number })[] }>) {
    const { auth } = usePage<PageProps>().props;
    const myGameIds = (auth.user?.games || []).map((g) => g.id);
    const [players, setPlayers] = useState(initialPlayers);
    const [liking, setLiking] = useState<number | null>(null);

    const handleLike = async (playerId: number) => {
        setLiking(playerId);
        try {
            // Remove pass first
            await axios.delete(route('discovery.removePass', { user: playerId }));
            // Then like
            const { data } = await axios.post(route('likes.store'), { liked_id: playerId });
            // Remove from list
            setPlayers((prev) => prev.filter((p) => p.id !== playerId));

            if (data.matched) {
                alert('New Friend! You matched with this player. Check your Friends page!');
            }
        } catch {
            alert('Something went wrong');
        }
        setLiking(null);
    };

    const handleRemovePass = async (playerId: number) => {
        try {
            await axios.delete(route('discovery.removePass', { user: playerId }));
            setPlayers((prev) => prev.filter((p) => p.id !== playerId));
        } catch {}
    };

    return (
        <AuthenticatedLayout>
            <Head title="Passed Players" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <Link href={route('discovery.index')} className="text-ink-500 transition hover:text-ink-900">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                    </svg>
                                </Link>
                                <div>
                                    <h1 className="text-2xl font-bold text-ink-900">Passed Players</h1>
                                    <p className="text-sm text-ink-500">{players.length} {players.length === 1 ? 'player' : 'players'} — give them a second chance</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {players.length === 0 ? (
                        <div className="rounded-2xl border border-ink-900/10 bg-white p-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neon-red/10">
                                <svg className="h-8 w-8 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-ink-500">No passed players</p>
                            <p className="mt-2 text-sm text-gray-500">You haven't passed on anyone yet.</p>
                            <Link href={route('discovery.index')} className="mt-4 inline-block rounded-xl bg-neon-red px-6 py-3 font-semibold text-white hover:bg-neon-red/80">
                                Discover Players
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {players.map((player) => {
                                const commonGames = player.games?.filter((g) => myGameIds.includes(g.id)) || [];

                                return (
                                    <div key={player.id} className="overflow-hidden rounded-xl border border-ink-900/10 bg-white transition hover:border-ink-900/20">
                                        {/* Game banner */}
                                        {player.games && player.games.length > 0 && (
                                            <div className="relative h-24 overflow-hidden">
                                                <img
                                                    src={player.games[0].cover_image || `/images/games/${player.games[0].slug}.svg`}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                                                {commonGames.length > 0 && (
                                                    <div className="absolute left-2 top-2 rounded-md bg-gaming-green/90 px-2 py-0.5 text-[10px] font-bold text-white">
                                                        {commonGames.length} in common
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="p-4">
                                            {/* Avatar + Info */}
                                            <div className="mb-3 flex items-center gap-3">
                                                <Link href={route('player.show', { username: player.profile?.username || player.id })}>
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-neon-red to-neon-red-deep text-lg font-bold text-white">
                                                        {player.profile?.avatar ? (
                                                            <img src={player.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            (player.profile?.username?.[0] || player.name[0]).toUpperCase()
                                                        )}
                                                    </div>
                                                </Link>
                                                <div className="min-w-0 flex-1">
                                                    <Link
                                                        href={route('player.show', { username: player.profile?.username || player.id })}
                                                        className="block truncate font-bold text-ink-900 hover:text-neon-red"
                                                    >
                                                        {player.profile?.username || player.name}
                                                    </Link>
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
                                                <div className="mb-3 flex flex-wrap gap-1">
                                                    {player.games.slice(0, 3).map((game) => (
                                                        <div key={game.id} className="flex items-center gap-1 rounded bg-bone-50 px-1.5 py-0.5">
                                                            <img src={game.cover_image || `/images/games/${game.slug}.svg`} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                                                            <span className="text-[10px] text-ink-500">{game.name.split(':')[0].split(' ').slice(0, 2).join(' ')}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleLike(player.id)}
                                                    disabled={liking === player.id}
                                                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gaming-green/10 py-2 text-sm font-semibold text-gaming-green transition hover:bg-gaming-green/20 disabled:opacity-50"
                                                >
                                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                                    </svg>
                                                    {liking === player.id ? 'Liking...' : 'Like'}
                                                </button>
                                                <button
                                                    onClick={() => handleRemovePass(player.id)}
                                                    className="rounded-lg bg-bone-100 px-3 py-2 text-xs text-ink-500 transition hover:bg-bone-200 hover:text-ink-900"
                                                    title="Remove from passed list (they'll appear in discover again)"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
