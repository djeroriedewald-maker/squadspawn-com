import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

export default function LikedYou({ players: initialPlayers }: PageProps<{ players: (User & { common_game_count?: number })[] }>) {
    const { auth } = usePage<PageProps>().props;
    const myGameIds = (auth.user?.games || []).map((g) => g.id);
    const [players, setPlayers] = useState(initialPlayers);
    const [processing, setProcessing] = useState<number | null>(null);
    const [toast, setToast] = useState<{ name: string; matchId?: number } | null>(null);

    const handleAccept = async (playerId: number) => {
        setProcessing(playerId);
        const player = players.find((p) => p.id === playerId);
        try {
            const { data } = await axios.post(route('likes.store'), { liked_id: playerId });
            setPlayers((prev) => prev.filter((p) => p.id !== playerId));
            setToast({
                name: player?.profile?.username || player?.name || 'Player',
                matchId: data.match?.id,
            });
            setTimeout(() => setToast(null), 5000);
        } catch {}
        setProcessing(null);
    };

    const handleDecline = async (playerId: number) => {
        setProcessing(playerId);
        try {
            await axios.post(route('likes.pass'), { passed_id: playerId });
            setPlayers((prev) => prev.filter((p) => p.id !== playerId));
        } catch {}
        setProcessing(null);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Liked You" />

            {/* Success toast */}
            {toast && (
                <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 animate-slide-in">
                    <div className="flex items-center gap-3 rounded-xl border border-gaming-green/30 bg-navy-800 px-5 py-3 shadow-lg shadow-gaming-green/10">
                        <svg className="h-5 w-5 text-gaming-green" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                        <p className="text-sm text-white">You and <strong>{toast.name}</strong> are now friends!</p>
                        {toast.matchId && (
                            <Link
                                href={route('chat.show', { playerMatch: toast.matchId })}
                                className="rounded-lg bg-gaming-green px-3 py-1 text-xs font-bold text-white hover:bg-gaming-green/80"
                            >
                                Chat
                            </Link>
                        )}
                        <button onClick={() => setToast(null)} className="text-gray-500 hover:text-white">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-3">
                        <Link href={route('discovery.index')} className="text-gray-400 transition hover:text-white">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                <span className="text-gaming-pink">Liked You</span>
                            </h1>
                            <p className="text-sm text-gray-400">
                                {players.length} {players.length === 1 ? 'gamer wants' : 'gamers want'} to play with you
                            </p>
                        </div>
                    </div>

                    {players.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-navy-800 p-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gaming-pink/10">
                                <svg className="h-8 w-8 text-gaming-pink" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-gray-400">No pending requests yet</p>
                            <p className="mt-2 text-sm text-gray-500">When someone likes your profile, they'll appear here.</p>
                            <Link href={route('discovery.index')} className="mt-4 inline-block rounded-xl bg-gaming-purple px-6 py-3 font-semibold text-white hover:bg-gaming-purple/80">
                                Discover Players
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {players.map((player) => {
                                const commonGames = player.games?.filter((g) => myGameIds.includes(g.id)) || [];
                                const isProcessing = processing === player.id;

                                return (
                                    <div key={player.id} className="overflow-hidden rounded-2xl border border-gaming-pink/20 bg-navy-800 transition hover:border-gaming-pink/40">
                                        {/* Game cover collage */}
                                        {player.games && player.games.length > 0 && (
                                            <div className="relative h-20 overflow-hidden">
                                                <div className="flex h-full">
                                                    {player.games.slice(0, 3).map((game, i) => (
                                                        <div key={game.id} className="flex-1 overflow-hidden" style={{ marginLeft: i > 0 ? '-1px' : 0 }}>
                                                            <img src={game.cover_image || `/images/games/${game.slug}.svg`} alt="" className="h-full w-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy-800" />
                                                {commonGames.length > 0 && (
                                                    <div className="absolute left-3 top-2 rounded-md bg-gaming-green/90 px-2 py-0.5 text-[10px] font-bold text-white">
                                                        {commonGames.length} game{commonGames.length > 1 ? 's' : ''} in common
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 p-4">
                                            {/* Avatar */}
                                            <Link href={route('player.show', { username: player.profile?.username || player.id })} className="shrink-0">
                                                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-pink/30 to-gaming-purple/30 text-xl font-bold text-white ring-2 ring-gaming-pink/30">
                                                    {player.profile?.avatar ? (
                                                        <img src={player.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        (player.profile?.username?.[0] || player.name[0]).toUpperCase()
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <Link href={route('player.show', { username: player.profile?.username || player.id })} className="font-bold text-white hover:text-gaming-purple">
                                                    {player.profile?.username || player.name}
                                                </Link>
                                                <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                                                    {player.profile?.region && <span className="text-xs text-gray-500">{player.profile.region}</span>}
                                                    {player.profile?.looking_for && (
                                                        <span className="rounded-full bg-gaming-purple/10 px-1.5 py-0.5 text-[10px] text-gaming-purple">{player.profile.looking_for}</span>
                                                    )}
                                                    {player.profile?.is_creator && (
                                                        <span className="rounded-full bg-gaming-pink/10 px-1.5 py-0.5 text-[10px] text-gaming-pink">Creator</span>
                                                    )}
                                                </div>
                                                {player.profile?.bio && (
                                                    <p className="mt-1 line-clamp-1 text-xs text-gray-400">{player.profile.bio}</p>
                                                )}
                                                {/* Game thumbnails */}
                                                {player.games && player.games.length > 0 && (
                                                    <div className="mt-1.5 flex -space-x-1">
                                                        {player.games.slice(0, 5).map((game) => (
                                                            <img key={game.id} src={game.cover_image || `/images/games/${game.slug}.svg`} alt={game.name} title={game.name} className="h-5 w-7 rounded-sm border border-navy-800 object-cover" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex shrink-0 gap-2">
                                                <button
                                                    onClick={() => handleDecline(player.id)}
                                                    disabled={isProcessing}
                                                    className="flex h-11 w-11 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 text-red-400 transition hover:border-red-500 hover:bg-red-500/20 disabled:opacity-50"
                                                    title="Decline"
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleAccept(player.id)}
                                                    disabled={isProcessing}
                                                    className="flex h-11 items-center gap-1.5 rounded-full bg-gaming-green px-5 font-semibold text-white transition hover:bg-gaming-green/80 disabled:opacity-50"
                                                    title="Accept — become friends!"
                                                >
                                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                                    </svg>
                                                    Accept
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
