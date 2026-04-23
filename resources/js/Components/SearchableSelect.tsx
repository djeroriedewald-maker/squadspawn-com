import { useEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption {
    value: string;
    label: string;
    /** Optional left-aligned image (e.g. game cover). */
    image?: string | null;
}

interface Props {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    emptyLabel?: string;
    emptyValue?: string;
    searchPlaceholder?: string;
    /** Position the popover relative to the trigger. */
    align?: 'left' | 'right';
    /** Visual variant — `on-image` uses opaque colours to survive a
     *  hero background. */
    variant?: 'default' | 'on-image';
    className?: string;
}

/**
 * Custom combobox that replaces native <select> when the list is long
 * or the page background makes native dropdown options unreadable.
 * Keyboard: Esc closes. Click-outside closes. Search filters on label.
 */
export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select…',
    emptyLabel = 'All',
    emptyValue = '',
    searchPlaceholder = 'Search…',
    align = 'left',
    variant = 'default',
    className = '',
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const selected = options.find((o) => o.value === value);
    const triggerLabel = selected?.label ?? (value === emptyValue ? emptyLabel : placeholder);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, query]);

    useEffect(() => {
        if (open) {
            // Focus the search input as soon as the popover appears so
            // typing works without an extra click.
            const id = requestAnimationFrame(() => searchRef.current?.focus());
            return () => cancelAnimationFrame(id);
        }
        setQuery('');
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    function pick(val: string) {
        onChange(val);
        setOpen(false);
    }

    const triggerBase = 'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition';
    const triggerStyle = variant === 'on-image'
        ? 'bg-white text-ink-900 shadow-lg hover:bg-bone-100'
        : 'border border-ink-900/10 bg-white text-ink-900 hover:border-neon-red/30 dark:bg-bone-100';

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`${triggerBase} ${triggerStyle}`}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {selected?.image && (
                    <img src={selected.image} alt="" className="h-5 w-7 rounded-sm object-cover" />
                )}
                <span className="min-w-0 truncate">{triggerLabel}</span>
                <svg
                    className={`h-4 w-4 shrink-0 text-ink-500 transition ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {open && (
                <>
                    {/* Click-outside dismissal */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setOpen(false)}
                        aria-hidden
                    />

                    <div
                        className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} z-50 mt-2 w-72 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-ink-900/10 dark:bg-bone-100`}
                        role="listbox"
                    >
                        {/* Search */}
                        <div className="border-b border-ink-900/5 p-2">
                            <div className="relative">
                                <svg className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    className="w-full rounded-lg bg-bone-50 py-2 pl-8 pr-2 text-sm text-ink-900 placeholder-ink-500 focus:outline-none focus:ring-1 focus:ring-neon-red/40"
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <ul className="max-h-72 overflow-y-auto py-1">
                            {/* "All / empty" entry */}
                            <li>
                                <button
                                    type="button"
                                    onClick={() => pick(emptyValue)}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${value === emptyValue ? 'bg-neon-red/10 text-neon-red' : 'text-ink-700 hover:bg-ink-900/5 hover:text-ink-900'}`}
                                >
                                    {emptyLabel}
                                </button>
                            </li>
                            {filtered.map((o) => (
                                <li key={o.value}>
                                    <button
                                        type="button"
                                        onClick={() => pick(o.value)}
                                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition ${o.value === value ? 'bg-neon-red/10 text-neon-red' : 'text-ink-700 hover:bg-ink-900/5 hover:text-ink-900'}`}
                                    >
                                        {o.image && (
                                            <img src={o.image} alt="" className="h-5 w-7 shrink-0 rounded-sm object-cover" />
                                        )}
                                        <span className="min-w-0 truncate">{o.label}</span>
                                    </button>
                                </li>
                            ))}
                            {filtered.length === 0 && (
                                <li className="px-3 py-4 text-center text-xs text-ink-500">
                                    No matches for "{query}"
                                </li>
                            )}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}
