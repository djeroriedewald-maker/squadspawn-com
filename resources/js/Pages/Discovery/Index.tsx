import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState, useCallback, useEffect } from 'react';

const REGIONS = [
    'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam',
    'Netherlands', 'Germany', 'United Kingdom', 'France', 'Spain', 'Italy',
    'United States', 'Canada', 'Brazil', 'Japan', 'South Korea', 'Australia',
];

export default function DiscoveryIndex({
    players,
    games,
    filters,
}: {
    players: { data: User[]; links: any };
    games: Game[];
    filters: { game_id?: number; region?: string };
}) {
    const { auth } = usePage<PageProps>().props;
    const myGames = auth.user?.games || [];
    const myGameIds = myGames.map((g) => g.id);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [animating, setAnimating] = useState<'left' | 'right' | null>(null);
    const [showMatch, setShowMatch] = useState(false);
    const [matchedUser, setMatchedUser] = useState<User | null>(null);

    const currentPlayer = players.data[currentIndex] ?? null;
    const remaining = Math.max(0, players.data.length - currentIndex - 1);

    // Games in common
    const commonGames = currentPlayer?.games?.filter((g) => myGameIds.includes(g.id)) || [];

    const handleFilter = (key: string, value: string) => {
        router.get(route('discovery.index'), { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    };

    const advance = useCallback(() => {
        setAnimating(null);
        if (currentIndex < players.data.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setCurrentIndex(players.data.length);
        }
    }, [currentIndex, players.data.length]);

    const handlePass = async () => {
        if (!currentPlayer || animating) return;
        setAnimating('left');
        try { await axios.post(route('likes.pass'), { passed_id: currentPlayer.id }); } catch {}
        setTimeout(advance, 300);
    };

    const handleLike = async () => {
        if (!currentPlayer || animating) return;
        setAnimating('right');
        try {
            const { data } = await axios.post(route('likes.store'), { liked_id: currentPlayer.id });
            if (data.matched) { setMatchedUser(currentPlayer); setShowMatch(true); }
        } catch {}
        setTimeout(advance, 300);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (showMatch || !currentPlayer || animating) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') handlePass();
            if (e.key === 'ArrowRight' || e.key === 'd') handleLike();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [currentPlayer, animating, showMatch]);

    const lookingForLabel = (val?: string) => {
        switch (val) { case 'casual': return 'Casual'; case 'ranked': return 'Ranked'; case 'friends': return 'Friends'; case 'any': return 'Open'; default: return val ?? ''; }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Discover Players" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {/* Header + Filters */}
                    <div className="mb-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h1 className="text-xl font-bold text-white">Discover</h1>
                            {currentPlayer && (
                                <span className="rounded-full bg-navy-800 px-3 py-1 text-xs text-gray-400">
                                    {remaining} more {remaining === 1 ? 'player' : 'players'}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={filters.game_id ?? ''}
                                onChange={(e) => handleFilter('game_id', e.target.value)}
                                className="rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                            >
                                <option value="">All Games</option>
                                {games.map((game) => (
                                    <option key={game.id} value={game.id}>{game.name}</option>
                                ))}
                            </select>
                            <select
                                value={filters.region ?? ''}
                                onChange={(e) => handleFilter('region', e.target.value)}
                                className="rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                            >
                                <option value="">All Regions</option>
                                {REGIONS.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Player Card */}
                    {currentPlayer ? (
                        <div className="relative">
                            <div
                                className={`overflow-hidden rounded-2xl border border-white/10 bg-navy-800 transition-all duration-300 ${
                                    animating === 'left' ? '-translate-x-full rotate-[-12deg] opacity-0'
                                    : animating === 'right' ? 'translate-x-full rotate-[12deg] opacity-0'
                                    : 'translate-x-0 rotate-0 opacity-100'
                                }`}
                            >
                                {/* Hero banner - main game cover */}
                                {currentPlayer.games && currentPlayer.games.length > 0 && (
                                    <div className="relative h-36 overflow-hidden">
                                        <img
                                            src={currentPlayer.games[0].cover_image || `/images/games/${currentPlayer.games[0].slug}.svg`}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-navy-800 via-navy-800/60 to-transparent" />
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* Avatar & Info */}
                                    <div className={`mb-5 flex items-center gap-4 ${currentPlayer.games?.length ? '-mt-14 relative z-10' : ''}`}>
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-navy-800 bg-gaming-purple/20 text-2xl font-bold text-gaming-purple">
                                            {currentPlayer.profile?.avatar ? (
                                                <img src={currentPlayer.profile.avatar} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                (currentPlayer.profile?.username ?? currentPlayer.name).charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <Link
                                                href={route('player.show', { username: currentPlayer.profile?.username || currentPlayer.id })}
                                                className="text-xl font-bold text-white hover:text-gaming-purple"
                                            >
                                                {currentPlayer.profile?.username ?? currentPlayer.name}
                                            </Link>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                {currentPlayer.profile?.region && (
                                                    <span className="text-sm text-gray-400">{currentPlayer.profile.region}</span>
                                                )}
                                                {currentPlayer.profile?.looking_for && (
                                                    <span className="rounded-full bg-gaming-purple/20 px-2.5 py-0.5 text-xs font-medium text-gaming-purple">
                                                        {lookingForLabel(currentPlayer.profile.looking_for)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Common games highlight */}
                                    {commonGames.length > 0 && (
                                        <div className="mb-4 rounded-lg border border-gaming-green/20 bg-gaming-green/5 px-3 py-2">
                                            <p className="text-xs font-medium text-gaming-green">
                                                {commonGames.length} game{commonGames.length > 1 ? 's' : ''} in common: {commonGames.map((g) => g.name.split(':')[0]).join(', ')}
                                            </p>
                                        </div>
                                    )}

                                    {/* Bio */}
                                    {currentPlayer.profile?.bio && (
                                        <p className="mb-5 text-sm leading-relaxed text-gray-300">{currentPlayer.profile.bio}</p>
                                    )}

                                    {/* Games grid */}
                                    {currentPlayer.games && currentPlayer.games.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Games</h4>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                {currentPlayer.games.map((game) => {
                                                    const isCommon = myGameIds.includes(game.id);
                                                    return (
                                                        <div key={game.id} className={`overflow-hidden rounded-lg border ${isCommon ? 'border-gaming-green/30 bg-gaming-green/5' : 'border-white/5 bg-navy-700'}`}>
                                                            <div className="relative h-14 overflow-hidden">
                                                                <img src={game.cover_image || `/images/games/${game.slug}.svg`} alt={game.name} className="h-full w-full object-cover" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-navy-700 to-transparent" />
                                                                {isCommon && (
                                                                    <div className="absolute right-1 top-1 rounded-full bg-gaming-green px-1.5 py-0.5 text-[8px] font-bold text-white">COMMON</div>
                                                                )}
                                                            </div>
                                                            <div className="px-2 py-1">
                                                                <p className="truncate text-[11px] font-semibold text-white">{game.name}</p>
                                                                {game.pivot?.rank && <p className="text-[10px] font-medium text-gaming-green">{game.pivot.rank}</p>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-center gap-4">
                                        <button
                                            onClick={handlePass}
                                            disabled={!!animating}
                                            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10 text-red-400 transition hover:border-red-500 hover:bg-red-500/20 hover:scale-110 disabled:opacity-50"
                                        >
                                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handleLike}
                                            disabled={!!animating}
                                            className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gaming-green/40 bg-gaming-green/10 text-gaming-green shadow-lg shadow-gaming-green/10 transition hover:border-gaming-green hover:bg-gaming-green/20 hover:scale-110 hover:shadow-gaming-green/25 disabled:opacity-50"
                                        >
                                            <svg className="h-9 w-9" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={handlePass}
                                            disabled={!!animating}
                                            className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/10 bg-white/5 text-gray-400 transition hover:border-white/20 hover:bg-white/10 hover:scale-110 disabled:opacity-50"
                                        >
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="mt-3 text-center text-[10px] text-gray-600">
                                        Keyboard: <kbd className="rounded bg-navy-700 px-1.5 py-0.5 text-gray-400">A</kbd> Pass &middot; <kbd className="rounded bg-navy-700 px-1.5 py-0.5 text-gray-400">D</kbd> Like
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-navy-800 p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gaming-purple/10">
                                <svg className="h-10 w-10 text-gaming-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-white">You've seen everyone!</h3>
                            <p className="mb-6 text-gray-400">No more players to discover right now. New gamers join every day!</p>
                            <div className="flex flex-col items-center gap-3">
                                <Link href={route('friends.index')} className="rounded-xl bg-gaming-purple px-6 py-3 font-semibold text-white hover:bg-gaming-purple/80">Chat With Friends</Link>
                                <button
                                    onClick={() => router.visit(route('discovery.index'))}
                                    className="text-sm text-gray-400 hover:text-white"
                                >
                                    Refresh
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Friend Overlay */}
            {showMatch && matchedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="mx-4 max-w-md animate-bounce rounded-2xl border border-gaming-green/30 bg-navy-800 p-8 text-center">
                        <div className="mb-4 text-gaming-green">
                            <svg className="mx-auto h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </div>
                        <h2 className="mb-2 bg-gradient-to-r from-gaming-purple to-gaming-green bg-clip-text text-3xl font-extrabold text-transparent">New Friend!</h2>
                        <p className="mb-6 text-gray-400">
                            You and <span className="font-semibold text-white">{matchedUser.profile?.username ?? matchedUser.name}</span> can now chat!
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowMatch(false)} className="flex-1 rounded-xl border border-white/10 bg-navy-700 px-4 py-3 font-semibold text-white hover:bg-navy-900">Keep Swiping</button>
                            <button onClick={() => { setShowMatch(false); router.visit(route('friends.index')); }} className="flex-1 rounded-xl bg-gaming-green px-4 py-3 font-semibold text-white hover:bg-gaming-green/80">View Friends</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
