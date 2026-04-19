import { Game } from '@/types';
import { Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

interface GameWithCount extends Game {
    users_count?: number;
}

interface Props {
    game: GameWithCount | null;
    open: boolean;
    onClose: () => void;
    inMyProfile: boolean;
    isAuthed: boolean;
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

export default function GameDetailModal({ game, open, onClose, inMyProfile, isAuthed }: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open || !game) return null;

    const addOrRemove = () => {
        if (!isAuthed) {
            router.visit(route('register'));
            return;
        }
        if (inMyProfile) {
            router.delete(route('games.quickRemove', game.id), { preserveScroll: true });
        } else {
            router.post(route('games.quickAdd', game.id), {}, { preserveScroll: true });
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/60 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-3xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cover */}
                <div className="relative aspect-[21/9] overflow-hidden rounded-t-2xl bg-ink-900">
                    <img
                        src={game.cover_image || `/images/games/${game.slug}.svg`}
                        alt={game.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                            const img = e.currentTarget;
                            if (!img.dataset.fallback) {
                                img.dataset.fallback = '1';
                                img.src = '/icons/icon-512.png';
                                img.classList.add('opacity-30');
                            }
                        }}
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900/85 to-transparent" />
                    <button
                        onClick={onClose}
                        className="absolute right-3 top-3 rounded-full bg-ink-900/70 p-2 text-white backdrop-blur-sm transition hover:bg-ink-900"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                                {game.genre && (
                                    <span className="rounded-md bg-neon-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                        {game.genre}
                                    </span>
                                )}
                                {game.released_at && (
                                    <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                                        {new Date(game.released_at).getFullYear()}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">{game.name}</h2>
                        </div>
                        {typeof game.users_count === 'number' && (
                            <div className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                {game.users_count.toLocaleString()} {game.users_count === 1 ? 'player' : 'players'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Body */}
                <div className="space-y-5 p-6">
                    {game.description && (
                        <p className="text-sm leading-relaxed text-ink-700">{game.description}</p>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
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

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                        <Link
                            href={isAuthed
                                ? route('discovery.index', { game_id: game.id })
                                : route('register')}
                            className="flex-1 rounded-xl bg-neon-red py-3 text-center text-sm font-bold text-white shadow-lg shadow-neon-red/25 transition hover:bg-neon-red/90"
                        >
                            Find Players →
                        </Link>
                        <button
                            type="button"
                            onClick={addOrRemove}
                            className={`group/remove flex-1 rounded-xl border-2 py-3 text-sm font-bold transition ${
                                inMyProfile
                                    ? 'border-gaming-green bg-gaming-green/10 text-gaming-green hover:border-neon-red hover:bg-neon-red/10 hover:text-neon-red'
                                    : 'border-ink-900/15 bg-white text-ink-900 hover:border-neon-red hover:text-neon-red'
                            }`}
                        >
                            {!isAuthed ? (
                                '+ Sign up to add'
                            ) : inMyProfile ? (
                                <>
                                    <span className="group-hover/remove:hidden">✓ In your profile</span>
                                    <span className="hidden group-hover/remove:inline">× Remove from profile</span>
                                </>
                            ) : (
                                '+ Add to profile'
                            )}
                        </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-ink-900/10 pt-4 text-xs">
                        <Link
                            href={route('games.show', game.slug)}
                            className="font-semibold text-neon-red hover:underline"
                        >
                            View full page →
                        </Link>
                        <span className="text-ink-500">Press Esc to close</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
