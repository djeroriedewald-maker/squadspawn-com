import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';

interface GameWithCount extends Game {
    users_count?: number;
}

interface Props {
    game: GameWithCount;
    relatedGames: GameWithCount[];
    isInMyProfile: boolean;
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

export default function GamesShow({ game, relatedGames, isInMyProfile }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAuthed = !!auth?.user;

    const addOrRemove = () => {
        if (!isAuthed) {
            router.visit(route('register'));
            return;
        }
        if (isInMyProfile) {
            router.delete(route('games.quickRemove', game.id), { preserveScroll: true });
        } else {
            router.post(route('games.quickAdd', game.id), {}, { preserveScroll: true });
        }
    };

    const content = (
        <>
            {/* Hero */}
            <div className="relative h-64 overflow-hidden bg-ink-900 sm:h-80 lg:h-96">
                <img
                    src={game.cover_image || `/images/games/${game.slug}.svg`}
                    alt={game.name}
                    className="h-full w-full object-cover opacity-70"
                    onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallback) {
                            img.dataset.fallback = '1';
                            img.src = '/icons/icon-512.png';
                        }
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bone-50 via-ink-900/30 to-transparent" />
            </div>

            <div className="relative mx-auto -mt-28 max-w-6xl px-4 sm:-mt-36 sm:px-6 lg:-mt-44 lg:px-8">
                {/* Breadcrumb */}
                <div className="mb-3 text-xs">
                    <Link href={route('games.index')} className="font-semibold text-white/80 hover:text-white">
                        ← All games
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                    {/* Cover card */}
                    <div className="overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-xl">
                        <div className="aspect-[3/4] overflow-hidden bg-ink-900">
                            <img
                                src={game.cover_image || `/images/games/${game.slug}.svg`}
                                alt={game.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    const img = e.currentTarget;
                                    if (!img.dataset.fallback) {
                                        img.dataset.fallback = '1';
                                        img.src = '/icons/icon-512.png';
                                        img.classList.add('opacity-30');
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-3 p-5">
                            <button
                                onClick={() => !isAuthed
                                    ? router.visit(route('register'))
                                    : router.visit(route('discovery.index', { game_id: game.id }))}
                                className="block w-full rounded-xl bg-neon-red py-3 text-center text-sm font-bold text-white shadow-lg shadow-neon-red/25 transition hover:bg-neon-red/90"
                            >
                                Find Players →
                            </button>
                            <button
                                onClick={addOrRemove}
                                className={`block w-full rounded-xl border-2 py-3 text-sm font-bold transition ${
                                    isInMyProfile
                                        ? 'border-gaming-green bg-gaming-green/10 text-gaming-green hover:bg-gaming-green/20'
                                        : 'border-ink-900/15 bg-white text-ink-900 hover:border-neon-red hover:text-neon-red'
                                }`}
                            >
                                {!isAuthed
                                    ? '+ Sign up to add'
                                    : isInMyProfile
                                        ? '✓ In your profile'
                                        : '+ Add to profile'}
                            </button>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-xl sm:p-8">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                            {game.genre && (
                                <span className="rounded-md bg-neon-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                    {game.genre}
                                </span>
                            )}
                            {game.released_at && (
                                <span className="rounded-md bg-ink-900/10 px-2 py-0.5 text-[10px] font-semibold text-ink-700">
                                    Released {new Date(game.released_at).getFullYear()}
                                </span>
                            )}
                            {typeof game.users_count === 'number' && (
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-gaming-green/15 px-2 py-0.5 text-[10px] font-bold text-gaming-green">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gaming-green" />
                                    {game.users_count.toLocaleString()} {game.users_count === 1 ? 'player' : 'players'}
                                </span>
                            )}
                        </div>

                        <h1 className="mb-4 text-3xl font-black leading-tight text-ink-900 sm:text-4xl">
                            {game.name}
                        </h1>

                        {game.description && (
                            <p className="text-sm leading-relaxed text-ink-700">{game.description}</p>
                        )}

                        <div className="mt-6 grid gap-5 sm:grid-cols-2">
                            {(() => {
                                const pretty = normalizedPlatforms(game.platforms);
                                if (pretty.length === 0) return null;
                                return (
                                    <div>
                                        <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">Platforms</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pretty.map((p) => (
                                                <span key={p} className="rounded-md border border-ink-900/10 bg-bone-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                            {game.rank_system && game.rank_system.length > 0 && (
                                <div>
                                    <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">Ranks</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {game.rank_system.map((r) => (
                                            <span key={r} className="rounded-md bg-ink-900/5 px-2.5 py-1 text-xs font-medium text-ink-700">
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related games */}
                {relatedGames.length > 0 && (
                    <section className="mt-12 mb-16">
                        <h2 className="mb-4 text-xl font-bold text-ink-900">
                            More {game.genre ?? 'games'}
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {relatedGames.map((rg) => (
                                <Link
                                    key={rg.id}
                                    href={route('games.show', rg.slug)}
                                    className="group flex gap-3 overflow-hidden rounded-xl border border-ink-900/10 bg-white p-3 transition hover:border-neon-red/40 hover:shadow-lg hover:shadow-neon-red/10"
                                >
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                                        <img
                                            src={rg.cover_image || `/images/games/${rg.slug}.svg`}
                                            alt={rg.name}
                                            loading="lazy"
                                            onError={(e) => {
                                                const img = e.currentTarget;
                                                if (!img.dataset.fallback) {
                                                    img.dataset.fallback = '1';
                                                    img.src = '/icons/icon-512.png';
                                                    img.classList.add('opacity-30');
                                                }
                                            }}
                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-bold text-ink-900 group-hover:text-neon-red">{rg.name}</div>
                                        {rg.genre && <div className="truncate text-[11px] text-ink-500">{rg.genre}</div>}
                                        {typeof rg.users_count === 'number' && (
                                            <div className="mt-0.5 text-[11px] font-semibold text-gaming-green">
                                                {rg.users_count.toLocaleString()} players
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </>
    );

    if (isAuthed) {
        return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
    }
    return <div className="min-h-screen bg-bone-50">{content}</div>;
}
