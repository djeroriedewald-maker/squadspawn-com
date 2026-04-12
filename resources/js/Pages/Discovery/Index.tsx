import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState, useCallback } from 'react';

export default function DiscoveryIndex({
    players,
    games,
    filters,
}: {
    players: { data: User[]; links: any };
    games: Game[];
    filters: { game_id?: number; region?: string };
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animating, setAnimating] = useState<'left' | 'right' | null>(null);
    const [showMatch, setShowMatch] = useState(false);
    const [matchedUser, setMatchedUser] = useState<User | null>(null);

    const currentPlayer = players.data[currentIndex] ?? null;

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('discovery.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true },
        );
    };

    const advance = useCallback(() => {
        setAnimating(null);
        if (currentIndex < players.data.length - 1) {
            setCurrentIndex((i) => i + 1);
        } else {
            setCurrentIndex(players.data.length);
        }
    }, [currentIndex, players.data.length]);

    const handlePass = () => {
        if (!currentPlayer || animating) return;
        setAnimating('left');

        router.post(
            route('discovery.pass', currentPlayer.id),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => {
                    setTimeout(advance, 300);
                },
                onError: () => {
                    setTimeout(advance, 300);
                },
            },
        );
    };

    const handleLike = () => {
        if (!currentPlayer || animating) return;
        setAnimating('right');

        router.post(
            route('discovery.like', currentPlayer.id),
            {},
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page: any) => {
                    if (page.props?.flash?.matched) {
                        setMatchedUser(currentPlayer);
                        setShowMatch(true);
                    }
                    setTimeout(advance, 300);
                },
                onError: () => {
                    setTimeout(advance, 300);
                },
            },
        );
    };

    const lookingForLabel = (val?: string) => {
        switch (val) {
            case 'casual': return 'Casual';
            case 'ranked': return 'Ranked';
            case 'friends': return 'Friends';
            case 'any': return 'Open';
            default: return val ?? '';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Discover" />

            <div className="py-8">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-4">
                        <select
                            value={filters.game_id ?? ''}
                            onChange={(e) => handleFilter('game_id', e.target.value)}
                            className="rounded-lg border border-white/10 bg-navy-800 px-4 py-2 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                        >
                            <option value="">All Games</option>
                            {games.map((game) => (
                                <option key={game.id} value={game.id}>
                                    {game.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filters.region ?? ''}
                            onChange={(e) => handleFilter('region', e.target.value)}
                            className="rounded-lg border border-white/10 bg-navy-800 px-4 py-2 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                        >
                            <option value="">All Regions</option>
                            {[
                                'Philippines', 'Indonesia', 'Malaysia', 'Singapore',
                                'Thailand', 'Vietnam', 'Myanmar', 'Cambodia',
                            ].map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* Player Card */}
                    {currentPlayer ? (
                        <div className="relative">
                            <div
                                className={`rounded-xl border border-white/10 bg-navy-800 p-6 transition-all duration-300 ${
                                    animating === 'left'
                                        ? '-translate-x-full rotate-[-12deg] opacity-0'
                                        : animating === 'right'
                                          ? 'translate-x-full rotate-[12deg] opacity-0'
                                          : 'translate-x-0 rotate-0 opacity-100'
                                }`}
                            >
                                {/* Avatar & Name */}
                                <div className="mb-6 flex items-center gap-4">
                                    {currentPlayer.profile?.avatar ? (
                                        <img
                                            src={currentPlayer.profile.avatar}
                                            alt=""
                                            className="h-20 w-20 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gaming-purple/20 text-2xl font-bold text-gaming-purple">
                                            {(currentPlayer.profile?.username ?? currentPlayer.name)
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {currentPlayer.profile?.username ?? currentPlayer.name}
                                        </h2>
                                        {currentPlayer.profile?.region && (
                                            <p className="text-sm text-gray-400">
                                                {currentPlayer.profile.region}
                                            </p>
                                        )}
                                        {currentPlayer.profile?.looking_for && (
                                            <span className="mt-1 inline-block rounded-full bg-gaming-purple/20 px-3 py-0.5 text-xs font-medium text-gaming-purple">
                                                {lookingForLabel(currentPlayer.profile.looking_for)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Bio */}
                                {currentPlayer.profile?.bio && (
                                    <p className="mb-6 text-gray-300">
                                        {currentPlayer.profile.bio}
                                    </p>
                                )}

                                {/* Games */}
                                {currentPlayer.games && currentPlayer.games.length > 0 && (
                                    <div className="mb-6">
                                        <h4 className="mb-2 text-sm font-medium text-gray-400">
                                            Games
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {currentPlayer.games.map((game) => (
                                                <div
                                                    key={game.id}
                                                    className="rounded-lg border border-white/10 bg-navy-700 px-3 py-2"
                                                >
                                                    <p className="text-sm font-medium text-white">
                                                        {game.name}
                                                    </p>
                                                    {game.pivot?.rank && (
                                                        <p className="text-xs text-gaming-green">
                                                            {game.pivot.rank}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="flex items-center justify-center gap-6">
                                    <button
                                        onClick={handlePass}
                                        disabled={!!animating}
                                        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-500/30 bg-red-500/10 text-red-400 transition hover:border-red-500 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
                                    >
                                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleLike}
                                        disabled={!!animating}
                                        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gaming-green/30 bg-gaming-green/10 text-gaming-green transition hover:border-gaming-green hover:bg-gaming-green/20 disabled:opacity-50"
                                    >
                                        <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-12 text-center">
                            <div className="mb-4 text-4xl text-gray-600">
                                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-lg font-semibold text-white">
                                No more players
                            </h3>
                            <p className="text-gray-400">
                                Check back later or adjust your filters to discover more players.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Match Overlay */}
            {showMatch && matchedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="mx-4 max-w-md animate-bounce rounded-2xl border border-gaming-green/30 bg-navy-800 p-8 text-center">
                        <div className="mb-4 text-5xl text-gaming-green">
                            <svg className="mx-auto h-16 w-16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                        </div>
                        <h2 className="mb-2 bg-gradient-to-r from-gaming-purple to-gaming-green bg-clip-text text-3xl font-extrabold text-transparent">
                            It's a Match!
                        </h2>
                        <p className="mb-6 text-gray-400">
                            You and{' '}
                            <span className="font-semibold text-white">
                                {matchedUser.profile?.username ?? matchedUser.name}
                            </span>{' '}
                            can now chat!
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowMatch(false)}
                                className="flex-1 rounded-xl border border-white/10 bg-navy-700 px-4 py-3 font-semibold text-white transition hover:bg-navy-900"
                            >
                                Keep Swiping
                            </button>
                            <button
                                onClick={() => {
                                    setShowMatch(false);
                                    router.visit(route('matches.index'));
                                }}
                                className="flex-1 rounded-xl bg-gaming-green px-4 py-3 font-semibold text-white transition hover:bg-gaming-green/80"
                            >
                                Go to Matches
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
