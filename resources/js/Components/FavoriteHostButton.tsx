import { useState } from 'react';

interface Props {
    hostId: number;
    initialFavorited: boolean;
    className?: string;
}

function xsrf(): string | null {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

export default function FavoriteHostButton({ hostId, initialFavorited, className = '' }: Props) {
    const [favorited, setFavorited] = useState(initialFavorited);
    const [busy, setBusy] = useState(false);

    async function toggle() {
        setBusy(true);
        const next = !favorited;
        setFavorited(next); // optimistic
        const token = xsrf();
        try {
            const res = await fetch(`/favorites/${hostId}`, {
                method: next ? 'POST' : 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-XSRF-TOKEN': token } : {}),
                },
            });
            if (!res.ok) setFavorited(!next); // rollback
        } catch {
            setFavorited(!next);
        } finally {
            setBusy(false);
        }
    }

    return (
        <button
            type="button"
            onClick={toggle}
            disabled={busy}
            aria-pressed={favorited}
            title={favorited ? 'Remove from favourites' : 'Add to favourites — get pinged when they host'}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                favorited
                    ? 'border-gaming-orange/40 bg-gaming-orange/10 text-gaming-orange hover:bg-gaming-orange/20'
                    : 'border-ink-900/10 text-ink-700 hover:border-gaming-orange/40 hover:text-gaming-orange'
            } ${className}`}
        >
            <svg className="h-4 w-4" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {favorited ? 'Favourited' : 'Favourite host'}
        </button>
    );
}
