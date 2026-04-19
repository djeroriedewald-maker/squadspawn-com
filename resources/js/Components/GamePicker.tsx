import { Game } from '@/types';
import { useEffect, useMemo, useRef, useState } from 'react';

interface Props {
    games: Game[];
    value: number | string | null;
    onChange: (gameId: number | null) => void;
    placeholder?: string;
    allowClear?: boolean;
    showCover?: boolean;
    allLabel?: string; // label shown for the empty/all option (e.g. "All Games")
    disabled?: boolean;
}

const onCoverError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.dataset.fallback) {
        img.dataset.fallback = '1';
        img.src = '/icons/icon-512.png';
        img.classList.add('opacity-30');
    }
};

export default function GamePicker({
    games,
    value,
    onChange,
    placeholder = 'Select a game',
    allowClear = false,
    showCover = true,
    allLabel,
    disabled = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlighted, setHighlighted] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selected = useMemo(
        () => (value ? games.find((g) => g.id === Number(value)) ?? null : null),
        [value, games],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return games;
        return games.filter((g) => g.name.toLowerCase().includes(q) || (g.genre ?? '').toLowerCase().includes(q));
    }, [games, query]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onDocClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [open]);

    // Focus input on open
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 0);
    }, [open]);

    // Reset highlight when list changes
    useEffect(() => setHighlighted(0), [query, open]);

    // Keep highlighted item in view
    useEffect(() => {
        const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlighted}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [highlighted]);

    function pick(game: Game | null) {
        onChange(game ? game.id : null);
        setOpen(false);
        setQuery('');
    }

    function handleKey(e: React.KeyboardEvent) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const pickable = filtered[highlighted];
            if (pickable) pick(pickable);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen((o) => !o)}
                className={`flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-2 text-left text-sm transition disabled:opacity-50 ${
                    open ? 'border-neon-red ring-1 ring-neon-red' : 'border-ink-900/10 hover:border-ink-900/20'
                }`}
            >
                {showCover && selected && (
                    <img
                        src={selected.cover_image || `/images/games/${selected.slug}.svg`}
                        alt=""
                        onError={onCoverError}
                        className="h-8 w-12 shrink-0 rounded-md object-cover"
                    />
                )}
                <span className={`flex-1 truncate ${selected ? 'text-ink-900' : 'text-ink-500'}`}>
                    {selected ? selected.name : (allLabel && !value ? allLabel : placeholder)}
                </span>
                {selected && allowClear && (
                    <span
                        role="button"
                        tabIndex={-1}
                        onClick={(e) => { e.stopPropagation(); pick(null); }}
                        className="rounded-full p-1 text-ink-500 transition hover:bg-bone-100 hover:text-neon-red"
                        aria-label="Clear"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </span>
                )}
                <svg className={`h-4 w-4 shrink-0 text-ink-500 transition ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-ink-900/10 bg-white shadow-lg">
                    {/* Search input */}
                    <div className="border-b border-ink-900/5 p-2">
                        <div className="relative">
                            <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0z" />
                            </svg>
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Search games…"
                                className="w-full rounded-md border border-ink-900/10 bg-bone-50 py-1.5 pl-8 pr-2 text-sm focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div ref={listRef} className="max-h-72 overflow-y-auto">
                        {allowClear && allLabel && !query && (
                            <button
                                type="button"
                                onClick={() => pick(null)}
                                className="flex w-full items-center gap-2 border-b border-ink-900/5 px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-bone-50"
                            >
                                <span className="flex h-5 w-5 items-center justify-center">
                                    {!value && <span className="h-2 w-2 rounded-full bg-neon-red" />}
                                </span>
                                {allLabel}
                            </button>
                        )}

                        {filtered.length === 0 ? (
                            <div className="py-8 text-center text-xs text-ink-500">
                                No games match "{query}"
                            </div>
                        ) : (
                            filtered.map((game, idx) => {
                                const isSelected = Number(value) === game.id;
                                const isHighlighted = idx === highlighted;
                                return (
                                    <button
                                        key={game.id}
                                        type="button"
                                        data-idx={idx}
                                        onClick={() => pick(game)}
                                        onMouseEnter={() => setHighlighted(idx)}
                                        className={`flex w-full items-center gap-3 border-b border-ink-900/5 px-3 py-2 text-left text-sm transition ${
                                            isSelected ? 'bg-neon-red/5' : isHighlighted ? 'bg-bone-50' : 'bg-white'
                                        }`}
                                    >
                                        {showCover && (
                                            <img
                                                src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                alt=""
                                                onError={onCoverError}
                                                loading="lazy"
                                                className="h-9 w-14 shrink-0 rounded-md object-cover"
                                            />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className={`truncate font-semibold ${isSelected ? 'text-neon-red' : 'text-ink-900'}`}>
                                                {game.name}
                                            </div>
                                            {game.genre && (
                                                <div className="truncate text-[11px] text-ink-500">{game.genre}</div>
                                            )}
                                        </div>
                                        {isSelected && (
                                            <svg className="h-4 w-4 shrink-0 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m5 12 5 5L20 7" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
