import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { gameCoverUrl } from '@/utils/gameImage';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState, useCallback, useEffect } from 'react';

const LOOKING_FOR = [
    { value: '', label: 'Any' },
    { value: 'casual', label: 'Casual' },
    { value: 'ranked', label: 'Ranked' },
    { value: 'friends', label: 'Friends' },
];

export default function DiscoveryIndex({
    players,
    games,
    filters,
    likedByCount,
    lastPassId,
    regions,
}: {
    players: { data: (User & { compatibility_score?: number; common_game_count?: number })[]; total: number };
    games: Game[];
    filters: { game_id?: number; region?: string; looking_for?: string; platform?: string };
    likedByCount: number;
    lastPassId: number | null;
    regions: string[];
}) {
    const { auth } = usePage<PageProps>().props;
    const myGames = auth.user?.games || [];
    const myGameIds = myGames.map((g) => g.id);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [animating, setAnimating] = useState<'left' | 'right' | null>(null);
    const [showMatch, setShowMatch] = useState(false);
    const [matchedUser, setMatchedUser] = useState<User | null>(null);
    const [canUndo, setCanUndo] = useState(!!lastPassId);
    const [showFilters, setShowFilters] = useState(false);

    const currentPlayer = players.data[currentIndex] ?? null;
    const remaining = Math.max(0, players.data.length - currentIndex - 1);
    const commonGames = currentPlayer?.games?.filter((g) => myGameIds.includes(g.id)) || [];

    const handleFilter = (key: string, value: string) => {
        router.get(route('discovery.index'), { ...filters, [key]: value || undefined }, { preserveState: false });
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
        try { await axios.post(route('likes.pass'), { passed_id: currentPlayer.id }); setCanUndo(true); } catch {}
        setTimeout(advance, 300);
    };

    const handleLike = async () => {
        if (!currentPlayer || animating) return;
        setAnimating('right');
        try {
            const { data } = await axios.post(route('likes.store'), { liked_id: currentPlayer.id });
            if (data.matched) { setMatchedUser(currentPlayer); setShowMatch(true); }
        } catch {}
        setCanUndo(false);
        setTimeout(advance, 300);
    };

    const handleUndo = async () => {
        if (!canUndo) return;
        try {
            await axios.post(route('discovery.undo'));
            setCanUndo(false);
            // Reload page to get the undone player back
            router.reload();
        } catch {}
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (showMatch || !currentPlayer || animating) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') handlePass();
            if (e.key === 'ArrowRight' || e.key === 'd') handleLike();
            if (e.key === 'z' && canUndo) handleUndo();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [currentPlayer, animating, showMatch, canUndo]);

    const lookingForLabel = (val?: string) => {
        switch (val) { case 'casual': return 'Casual'; case 'ranked': return 'Ranked'; case 'friends': return 'Friends'; case 'any': return 'Open'; default: return val ?? ''; }
    };

    const scoreColor = (score?: number) => {
        if (!score) return 'text-gray-500';
        if (score >= 30) return 'text-gaming-green';
        if (score >= 15) return 'text-neon-red';
        return 'text-ink-500';
    };

    const scoreLabel = (score?: number) => {
        if (!score || score < 5) return null;
        if (score >= 30) return 'Great Match';
        if (score >= 20) return 'Good Match';
        if (score >= 10) return 'Some in Common';
        return null;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Discover Players" />

            {/* Hero banner */}
            <div className="relative h-32 overflow-hidden sm:h-40">
                <img src="/images/gamer6.jpg" alt="" className="h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-bone-50/10 via-bone-50/50 to-bone-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Discover Players</h1>
                        <p className="mt-1 text-sm text-ink-500">Find your perfect gaming partner</p>
                    </div>
                </div>
            </div>

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500">{players.total} players available</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {remaining > 0 && (
                                <span className="rounded-full bg-white px-3 py-1 text-xs text-ink-500">{remaining} more</span>
                            )}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${showFilters ? 'bg-neon-red text-white' : 'bg-white text-ink-500 hover:text-ink-900'}`}
                            >
                                <svg className="mr-1 inline h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                                </svg>
                                Filters
                            </button>
                        </div>
                    </div>

                    {/* Liked by banner */}
                    {likedByCount > 0 && (
                        <Link
                            href={route('discovery.likedYou')}
                            className="mb-4 flex items-center gap-2 rounded-xl border border-gaming-pink/20 bg-gaming-pink/5 px-4 py-2.5 transition hover:border-gaming-pink/40 hover:bg-gaming-pink/10"
                        >
                            <svg className="h-4 w-4 text-gaming-pink" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                            <p className="flex-1 text-sm text-ink-700"><strong className="text-gaming-pink">{likedByCount}</strong> {likedByCount === 1 ? 'gamer wants' : 'gamers want'} to play with you!</p>
                            <span className="rounded-full bg-gaming-pink px-3 py-1 text-xs font-bold text-white">View</span>
                        </Link>
                    )}

                    {/* Filters */}
                    {showFilters && (
                        <div className="mb-4 rounded-xl border border-ink-900/10 bg-white p-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-500">Game</label>
                                    <select value={filters.game_id ?? ''} onChange={(e) => handleFilter('game_id', e.target.value)} className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red">
                                        <option value="">All Games</option>
                                        {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-500">Region</label>
                                    <select value={filters.region ?? ''} onChange={(e) => handleFilter('region', e.target.value)} className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red">
                                        <option value="">All Regions</option>
                                        {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-500">Looking For</label>
                                    <select value={filters.looking_for ?? ''} onChange={(e) => handleFilter('looking_for', e.target.value)} className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red">
                                        {LOOKING_FOR.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-gray-500">Platform</label>
                                    <select value={filters.platform ?? ''} onChange={(e) => handleFilter('platform', e.target.value)} className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red">
                                        <option value="">All Platforms</option>
                                        <option value="pc">PC</option>
                                        <option value="console">Console</option>
                                        <option value="mobile">Mobile</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Player Card */}
                    {currentPlayer ? (
                        <div className="relative">
                            <div className={`overflow-hidden rounded-2xl border border-ink-900/10 bg-white transition-all duration-300 ${
                                animating === 'left' ? '-translate-x-full rotate-[-12deg] opacity-0'
                                : animating === 'right' ? 'translate-x-full rotate-[12deg] opacity-0'
                                : 'translate-x-0 rotate-0 opacity-100'
                            }`}>
                                {/* Game banner */}
                                {currentPlayer.games && currentPlayer.games.length > 0 && (
                                    <div className="relative h-36 overflow-hidden">
                                        <img src={gameCoverUrl(currentPlayer.games[0].cover_image, 'card') || `/images/games/${currentPlayer.games[0].slug}.svg`} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-white via-bone-100/60 to-transparent" />

                                        {/* Compatibility badge */}
                                        {scoreLabel(currentPlayer.compatibility_score) && (
                                            <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-2.5 py-1 backdrop-blur-sm">
                                                <span className={`text-xs font-bold ${scoreColor(currentPlayer.compatibility_score)}`}>
                                                    {scoreLabel(currentPlayer.compatibility_score)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="p-6">
                                    {/* Avatar & Info */}
                                    <div className={`mb-4 flex items-center gap-4 ${currentPlayer.games?.length ? '-mt-14 relative z-10' : ''}`}>
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-ink-800 bg-neon-red/20 text-2xl font-bold text-neon-red">
                                            {currentPlayer.profile?.avatar ? (
                                                <img src={currentPlayer.profile.avatar} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                (currentPlayer.profile?.username ?? currentPlayer.name).charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <Link href={route('player.show', { username: currentPlayer.profile?.username || currentPlayer.id })} className="text-xl font-bold text-ink-900 hover:text-neon-red">
                                                {currentPlayer.profile?.username ?? currentPlayer.name}
                                            </Link>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                {currentPlayer.profile?.region && <span className="text-sm text-ink-500">{currentPlayer.profile.region}</span>}
                                                {currentPlayer.profile?.looking_for && (
                                                    <span className="rounded-full bg-neon-red/20 px-2.5 py-0.5 text-xs font-medium text-neon-red">
                                                        {lookingForLabel(currentPlayer.profile.looking_for)}
                                                    </span>
                                                )}
                                                {currentPlayer.profile?.is_creator && (
                                                    <span className="rounded-full bg-gaming-pink/20 px-2.5 py-0.5 text-xs font-medium text-gaming-pink">Creator</span>
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
                                        <p className="mb-5 text-sm leading-relaxed text-ink-700">{currentPlayer.profile.bio}</p>
                                    )}

                                    {/* Games grid */}
                                    {currentPlayer.games && currentPlayer.games.length > 0 && (
                                        <div className="mb-6">
                                            <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Games</h4>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                                {currentPlayer.games.map((game) => {
                                                    const isCommon = myGameIds.includes(game.id);
                                                    return (
                                                        <div key={game.id} className={`overflow-hidden rounded-lg border ${isCommon ? 'border-gaming-green/30 bg-gaming-green/5' : 'border-ink-900/5 bg-bone-100'}`}>
                                                            <div className="relative h-14 overflow-hidden">
                                                                <img src={gameCoverUrl(game.cover_image, 'thumb') || `/images/games/${game.slug}.svg`} alt={game.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-bone-100 to-transparent" />
                                                                {isCommon && <div className="absolute right-1 top-1 rounded-full bg-gaming-green px-1.5 py-0.5 text-[8px] font-bold text-white">COMMON</div>}
                                                            </div>
                                                            <div className="px-2 py-1">
                                                                <p className="truncate text-[11px] font-semibold text-ink-900">{game.name}</p>
                                                                <div className="flex items-center gap-1">
                                                                    {game.pivot?.rank && <span className="text-[10px] font-medium text-gaming-green">{game.pivot.rank}</span>}
                                                                    {game.pivot?.role && <span className="text-[10px] text-gray-500">{game.pivot.role}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-center gap-3">
                                        {/* Undo */}
                                        <button
                                            onClick={handleUndo}
                                            disabled={!canUndo || !!animating}
                                            className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-900/10 bg-ink-900/5 text-ink-500 transition hover:scale-110 hover:bg-ink-900/10 hover:text-yellow-400 disabled:opacity-30"
                                            title="Undo last pass (Z)"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                            </svg>
                                        </button>

                                        {/* Pass */}
                                        <button
                                            onClick={handlePass}
                                            disabled={!!animating}
                                            className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10 text-red-400 transition hover:border-red-500 hover:bg-red-500/20 hover:scale-110 disabled:opacity-50"
                                            title="Pass (A)"
                                        >
                                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>

                                        {/* Like */}
                                        <button
                                            onClick={handleLike}
                                            disabled={!!animating}
                                            className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gaming-green/40 bg-gaming-green/10 text-gaming-green shadow-lg shadow-gaming-green/10 transition hover:border-gaming-green hover:bg-gaming-green/20 hover:scale-110 hover:shadow-gaming-green/25 disabled:opacity-50"
                                            title="Like (D)"
                                        >
                                            <svg className="h-9 w-9" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                            </svg>
                                        </button>

                                        {/* Skip */}
                                        <button
                                            onClick={handlePass}
                                            disabled={!!animating}
                                            className="flex h-14 w-14 items-center justify-center rounded-full border border-ink-900/10 bg-ink-900/5 text-ink-500 transition hover:border-ink-900/20 hover:bg-ink-900/10 hover:scale-110 disabled:opacity-50"
                                            title="Skip"
                                        >
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="mt-3 text-center text-[10px] text-gray-600">
                                        <kbd className="rounded bg-bone-100 px-1.5 py-0.5 text-ink-500">A</kbd> Pass
                                        <span className="mx-2">&middot;</span>
                                        <kbd className="rounded bg-bone-100 px-1.5 py-0.5 text-ink-500">D</kbd> Like
                                        <span className="mx-2">&middot;</span>
                                        <kbd className="rounded bg-bone-100 px-1.5 py-0.5 text-ink-500">Z</kbd> Undo
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-ink-900/10 bg-white p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neon-red/10">
                                <svg className="h-10 w-10 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-ink-900">You've seen everyone!</h3>
                            <p className="mb-6 text-ink-500">No more players to discover right now. New gamers join every day!</p>
                            <div className="flex flex-col items-center gap-3">
                                <Link href={route('discovery.passed')} className="rounded-xl bg-gaming-green/10 px-6 py-3 font-semibold text-gaming-green transition hover:bg-gaming-green/20">
                                    Review Passed Players
                                </Link>
                                <Link href={route('friends.index')} className="rounded-xl bg-neon-red px-6 py-3 font-semibold text-white hover:bg-neon-red/80">Chat With Friends</Link>
                                <button onClick={() => router.visit(route('discovery.index'))} className="text-sm text-ink-500 hover:text-ink-900">Refresh</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Friend Overlay */}
            {showMatch && matchedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="mx-4 max-w-md animate-bounce rounded-2xl border border-gaming-green/30 bg-white p-8 text-center">
                        <div className="mb-4 text-gaming-green">
                            <svg className="mx-auto h-16 w-16" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                        </div>
                        <h2 className="mb-2 bg-gradient-to-r from-neon-red to-gaming-green bg-clip-text text-3xl font-extrabold text-transparent">New Friend!</h2>
                        <p className="mb-6 text-ink-500">You and <span className="font-semibold text-ink-900">{matchedUser.profile?.username ?? matchedUser.name}</span> can now chat!</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowMatch(false)} className="flex-1 rounded-xl border border-ink-900/10 bg-bone-100 px-4 py-3 font-semibold text-ink-900 hover:bg-bone-50">Keep Swiping</button>
                            <button onClick={() => { setShowMatch(false); router.visit(route('friends.index')); }} className="flex-1 rounded-xl bg-gaming-green px-4 py-3 font-semibold text-white hover:bg-gaming-green/80">View Friends</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
