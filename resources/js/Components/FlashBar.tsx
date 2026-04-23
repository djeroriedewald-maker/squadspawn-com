import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface FlashBarPayload {
    message: string;
    tone: 'info' | 'warning' | 'danger';
}

/**
 * Site-wide admin-controlled flash bar. A dismiss stays local (one
 * localStorage flag per message content) so a user can close it but
 * still sees the next one the admin posts. Admin view always shows
 * it — they need to know when they're running a message.
 */
export default function FlashBar() {
    const { flashBar } = usePage().props as { flashBar?: FlashBarPayload | null };
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (!flashBar?.message) return;
        const key = 'flashbar:dismissed:' + btoa(flashBar.message).slice(0, 24);
        try {
            setDismissed(localStorage.getItem(key) === '1');
        } catch {
            setDismissed(false);
        }
    }, [flashBar?.message]);

    if (!flashBar?.message || dismissed) return null;

    const key = 'flashbar:dismissed:' + btoa(flashBar.message).slice(0, 24);
    const dismiss = () => {
        try { localStorage.setItem(key, '1'); } catch {}
        setDismissed(true);
    };

    const toneClass = {
        info: 'bg-gaming-cyan/15 border-gaming-cyan/30 text-gaming-cyan',
        warning: 'bg-gaming-orange/15 border-gaming-orange/30 text-gaming-orange',
        danger: 'bg-neon-red/15 border-neon-red/40 text-neon-red',
    }[flashBar.tone];

    return (
        <div className={`sticky top-0 z-40 border-b px-4 py-2 text-xs font-medium backdrop-blur-md ${toneClass}`}>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                        flashBar.tone === 'info' ? 'bg-gaming-cyan'
                            : flashBar.tone === 'warning' ? 'bg-gaming-orange'
                                : 'bg-neon-red'
                    }`} />
                    {flashBar.message}
                </span>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss"
                    className="shrink-0 rounded p-1 opacity-70 transition hover:opacity-100"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
