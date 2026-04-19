import { Link } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';

interface SearchResult {
    id: number;
    username: string;
    avatar?: string;
    region?: string;
    games_count: number;
}

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (query.length < 2) { setResults([]); return; }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const { data } = await axios.get(route('search'), { params: { q: query } });
                setResults(data);
                setOpen(true);
            } catch {}
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="relative">
            <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder="Search players..."
                    className="w-full rounded-lg border border-ink-900/10 bg-bone-100 py-2 pl-9 pr-3 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red sm:w-56"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-neon-red border-t-transparent" />
                    </div>
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-ink-900/10 bg-white shadow-lg">
                    {results.map((player) => (
                        <Link
                            key={player.id}
                            href={route('player.show', { username: player.username })}
                            onClick={() => { setOpen(false); setQuery(''); }}
                            className="flex items-center gap-3 px-4 py-3 transition hover:bg-bone-100"
                        >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20 text-xs font-bold text-neon-red">
                                {player.avatar ? (
                                    <img src={player.avatar} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    player.username[0].toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-ink-900">{player.username}</p>
                                <p className="text-[10px] text-gray-500">{player.region || 'No region'} &middot; {player.games_count} games</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {open && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-ink-900/10 bg-white px-4 py-4 text-center text-sm text-gray-500 shadow-lg">
                    No players found
                </div>
            )}
        </div>
    );
}
