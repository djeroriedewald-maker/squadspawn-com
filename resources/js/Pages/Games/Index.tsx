import GameDetailModal from '@/Components/GameDetailModal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

interface GameWithCount extends Game {
    users_count: number;
}

interface PaginatedGames {
    data: GameWithCount[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    search: string;
    genre: string | null;
    platform: string | null;
    sort: string;
    mine: boolean;
}

interface FilterOptions {
    genres: string[];
    platforms: string[];
}

interface Props {
    games: PaginatedGames;
    filters: Filters;
    filterOptions: FilterOptions;
    myGameIds: number[];
}

const PLATFORM_LABELS: Record<string, string> = {
    pc: 'PC', playstation: 'PlayStation', xbox: 'Xbox', nintendo: 'Switch',
    mac: 'Mac', linux: 'Linux', ios: 'iOS', android: 'Android',
    mobile: 'Mobile', web: 'Web',
};

function prettyPlatform(p: unknown): string {
    if (typeof p === 'string') {
        const key = p.toLowerCase();
        return PLATFORM_LABELS[key] ?? p.charAt(0).toUpperCase() + p.slice(1);
    }
    if (p && typeof p === 'object') {
        const slug = (p as any).slug ?? (p as any).platform?.slug ?? (p as any).name ?? '';
        if (typeof slug === 'string' && slug) return prettyPlatform(slug);
    }
    return '';
}

function normalizedPlatforms(list: unknown): string[] {
    if (!Array.isArray(list)) return [];
    return list
        .map((p) => prettyPlatform(p))
        .filter((p): p is string => typeof p === 'string' && p.length > 0);
}

const SORT_OPTIONS = [
    { value: 'popular', label: 'Most players' },
    { value: 'alphabetical', label: 'A – Z' },
    { value: 'newest', label: 'Newest added' },
    { value: 'released', label: 'Release date' },
];

export default function GamesIndex({ games, filters, filterOptions, myGameIds }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAuthed = !!auth?.user;

    const [searchInput, setSearchInput] = useState(filters.search);
    const [selected, setSelected] = useState<GameWithCount | null>(null);
    const myIds = useMemo(() => new Set(myGameIds), [myGameIds]);

    // Debounced search: fires after user stops typing
    useEffect(() => {
        if (searchInput === filters.search) return;
        const timer = setTimeout(() => applyFilters({ search: searchInput, page: 1 }), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    function applyFilters(patch: Record<string, string | number | boolean | null>) {
        const merged: Record<string, any> = {
            search: filters.search,
            genre: filters.genre,
            platform: filters.platform,
            sort: filters.sort,
            mine: filters.mine ? 1 : undefined,
            ...patch,
        };
        // Strip empties so the URL stays clean
        Object.keys(merged).forEach((k) => {
            if (merged[k] === '' || merged[k] === null || merged[k] === undefined || merged[k] === false) {
                delete merged[k];
            }
        });
        router.get(route('games.index'), merged, { preserveState: true, preserveScroll: true, replace: true });
    }

    const activeFilterCount =
        (filters.search ? 1 : 0) +
        (filters.genre ? 1 : 0) +
        (filters.platform ? 1 : 0) +
        (filters.mine ? 1 : 0);

    const content = (
        <>
            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-col gap-2 text-center sm:mb-8">
                        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">Games</h1>
                        <p className="text-sm text-ink-500">
                            {games.total.toLocaleString()} {games.total === 1 ? 'game' : 'games'} · Find players for any title
                        </p>
                    </div>

                    {/* Filter bar */}
                    <div className="mb-6 rounded-2xl border border-ink-900/10 bg-white p-4 shadow-sm">
                        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
                            {/* Search */}
                            <div className="relative">
                                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Search games…"
                                    className="w-full rounded-lg border border-ink-900/10 bg-bone-50 py-2 pl-9 pr-3 text-sm text-ink-900 placeholder-ink-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                />
                            </div>

                            {/* Genre */}
                            <select
                                value={filters.genre ?? ''}
                                onChange={(e) => applyFilters({ genre: e.target.value || null, page: 1 })}
                                className="rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm font-medium text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                            >
                                <option value="">All genres</option>
                                {filterOptions.genres.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>

                            {/* Platform */}
                            <select
                                value={filters.platform ?? ''}
                                onChange={(e) => applyFilters({ platform: e.target.value || null, page: 1 })}
                                className="rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm font-medium text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                            >
                                <option value="">All platforms</option>
                                {filterOptions.platforms.map((p) => (
                                    <option key={p} value={p}>{prettyPlatform(p)}</option>
                                ))}
                            </select>

                            {/* Sort */}
                            <select
                                value={filters.sort}
                                onChange={(e) => applyFilters({ sort: e.target.value, page: 1 })}
                                className="rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm font-medium text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                            >
                                {SORT_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>

                            {/* Mine toggle — only when logged in */}
                            {isAuthed && (
                                <button
                                    type="button"
                                    onClick={() => applyFilters({ mine: !filters.mine, page: 1 })}
                                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                                        filters.mine
                                            ? 'border-neon-red bg-neon-red text-white'
                                            : 'border-ink-900/10 bg-bone-50 text-ink-700 hover:border-neon-red/50 hover:text-neon-red'
                                    }`}
                                >
                                    My Games
                                </button>
                            )}
                        </div>

                        {/* Active-filter chips */}
                        {activeFilterCount > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-900/5 pt-3 text-xs">
                                <span className="font-bold uppercase tracking-widest text-ink-500">Active:</span>
                                {filters.search && <Chip label={`"${filters.search}"`} onClear={() => { setSearchInput(''); applyFilters({ search: null, page: 1 }); }} />}
                                {filters.genre && <Chip label={filters.genre} onClear={() => applyFilters({ genre: null, page: 1 })} />}
                                {filters.platform && <Chip label={prettyPlatform(filters.platform)} onClear={() => applyFilters({ platform: null, page: 1 })} />}
                                {filters.mine && <Chip label="My Games" onClear={() => applyFilters({ mine: false, page: 1 })} />}
                                <button
                                    onClick={() => { setSearchInput(''); router.get(route('games.index')); }}
                                    className="ml-auto text-neon-red hover:underline"
                                >
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Grid */}
                    {games.data.length > 0 ? (
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {games.data.map((game) => (
                                <GameCard
                                    key={game.id}
                                    game={game}
                                    inMyProfile={myIds.has(game.id)}
                                    onOpen={() => setSelected(game)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-ink-900/10 bg-white p-12 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neon-red/10">
                                <svg className="h-6 w-6 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-ink-900">No games match your filters</h3>
                            <p className="mt-1 text-sm text-ink-500">Try clearing some filters or a different search.</p>
                        </div>
                    )}

                    {/* Pagination */}
                    {games.last_page > 1 && (
                        <Pagination games={games} applyFilters={applyFilters} />
                    )}
                </div>
            </div>

            <GameDetailModal
                game={selected}
                open={!!selected}
                onClose={() => setSelected(null)}
                inMyProfile={selected ? myIds.has(selected.id) : false}
                isAuthed={isAuthed}
            />
        </>
    );

    if (isAuthed) {
        return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
    }
    return <div className="min-h-screen bg-bone-50">{content}</div>;
}

// ----- local components ------------------------------------------------------

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-neon-red/10 px-2.5 py-1 font-semibold text-neon-red">
            {label}
            <button onClick={onClear} aria-label="Remove filter" className="ml-1 rounded-full hover:bg-neon-red/20">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </span>
    );
}

function GameCard({ game, inMyProfile, onOpen }: { game: GameWithCount; inMyProfile: boolean; onOpen: () => void }) {
    return (
        <button
            onClick={onOpen}
            className="group flex flex-col overflow-hidden rounded-xl border border-ink-900/10 bg-white text-left transition hover:-translate-y-0.5 hover:border-neon-red/40 hover:shadow-lg hover:shadow-neon-red/15"
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-ink-900">
                <img
                    src={game.cover_image || `/images/games/${game.slug}.svg`}
                    alt={game.name}
                    loading="lazy"
                    onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallback) {
                            img.dataset.fallback = '1';
                            img.src = '/icons/icon-512.png';
                            img.classList.add('opacity-30');
                        }
                    }}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900/80 to-transparent" />

                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink-900/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-gaming-green" />
                    {game.users_count.toLocaleString()} {game.users_count === 1 ? 'player' : 'players'}
                </div>

                {inMyProfile && (
                    <div className="absolute left-3 top-3 rounded-full bg-gaming-green px-2 py-0.5 text-[10px] font-bold text-ink-900">
                        ✓ IN PROFILE
                    </div>
                )}

                {game.genre && (
                    <div className="absolute bottom-3 left-3">
                        <span className="rounded-md bg-neon-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                            {game.genre}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h3 className="truncate text-lg font-bold leading-tight text-ink-900 group-hover:text-neon-red">
                    {game.name}
                </h3>
                {game.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                        {game.description}
                    </p>
                )}

                {(() => {
                    const pretty = normalizedPlatforms(game.platforms);
                    if (pretty.length === 0) return null;
                    return (
                        <div className="mt-3 flex flex-wrap gap-1">
                            {pretty.slice(0, 4).map((p) => (
                                <span key={p} className="rounded-md border border-ink-900/10 bg-bone-50 px-1.5 py-0.5 text-[10px] font-semibold text-ink-700">
                                    {p}
                                </span>
                            ))}
                            {pretty.length > 4 && (
                                <span className="rounded-md bg-ink-900/5 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                                    +{pretty.length - 4}
                                </span>
                            )}
                        </div>
                    );
                })()}

                <div className="mt-auto pt-3 text-xs font-semibold text-neon-red">
                    View details →
                </div>
            </div>
        </button>
    );
}

function Pagination({
    games,
    applyFilters,
}: {
    games: PaginatedGames;
    applyFilters: (patch: Record<string, any>) => void;
}) {
    const { current_page, last_page, from, to, total } = games;
    const pages = Array.from({ length: last_page }, (_, i) => i + 1);
    const show = pages.filter(
        (p) => p === 1 || p === last_page || Math.abs(p - current_page) <= 1,
    );

    return (
        <div className="mt-8 flex flex-col items-center gap-3">
            <div className="text-xs text-ink-500">
                Showing {from ?? 0}–{to ?? 0} of {total.toLocaleString()}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1">
                <button
                    disabled={current_page === 1}
                    onClick={() => applyFilters({ page: current_page - 1 })}
                    className="rounded-lg border border-ink-900/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 transition hover:border-neon-red hover:text-neon-red disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-900/10 disabled:hover:text-ink-700"
                >
                    ←
                </button>

                {show.map((p, i) => {
                    const prev = show[i - 1];
                    const gap = prev && p - prev > 1;
                    return (
                        <span key={p} className="flex items-center gap-1">
                            {gap && <span className="px-1 text-sm text-ink-500">…</span>}
                            <button
                                onClick={() => applyFilters({ page: p })}
                                className={`min-w-[36px] rounded-lg px-2 py-1.5 text-sm font-semibold transition ${
                                    p === current_page
                                        ? 'bg-neon-red text-white shadow-lg shadow-neon-red/25'
                                        : 'border border-ink-900/10 bg-white text-ink-700 hover:border-neon-red hover:text-neon-red'
                                }`}
                            >
                                {p}
                            </button>
                        </span>
                    );
                })}

                <button
                    disabled={current_page === last_page}
                    onClick={() => applyFilters({ page: current_page + 1 })}
                    className="rounded-lg border border-ink-900/10 bg-white px-3 py-1.5 text-sm font-semibold text-ink-700 transition hover:border-neon-red hover:text-neon-red disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink-900/10 disabled:hover:text-ink-700"
                >
                    →
                </button>
            </div>
        </div>
    );
}
