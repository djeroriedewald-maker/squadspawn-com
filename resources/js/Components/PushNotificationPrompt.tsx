import {
    currentPermission,
    disablePush,
    enablePush,
    hasLocalSubscription,
    isPushSupported,
} from '@/utils/push';
import { useEffect, useState } from 'react';

export default function PushNotificationPrompt() {
    const [state, setState] = useState<'loading' | 'unsupported' | 'idle' | 'enabled' | 'denied'>('loading');
    const [vapidKey, setVapidKey] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!isPushSupported()) {
                if (!cancelled) setState('unsupported');
                return;
            }

            // Fetch the VAPID public key + current server-side subscription state
            let key: string | null = null;
            try {
                const res = await fetch('/push/config', { credentials: 'same-origin' });
                const json = await res.json();
                key = json.vapidPublicKey ?? null;
            } catch {
                /* ignore — stay in idle */
            }

            if (cancelled) return;
            setVapidKey(key);

            const perm = currentPermission();
            if (perm === 'denied') { setState('denied'); return; }

            const hasLocal = await hasLocalSubscription();
            if (cancelled) return;
            setState(perm === 'granted' && hasLocal ? 'enabled' : 'idle');
        })();
        return () => { cancelled = true; };
    }, []);

    if (state === 'loading' || state === 'unsupported') return null;
    if (!vapidKey && state !== 'enabled') return null; // no key configured — hide

    async function handleEnable() {
        if (!vapidKey) return;
        setBusy(true);
        const ok = await enablePush(vapidKey);
        setBusy(false);
        setState(ok ? 'enabled' : currentPermission() === 'denied' ? 'denied' : 'idle');
    }

    async function handleDisable() {
        setBusy(true);
        await disablePush();
        setBusy(false);
        setState('idle');
    }

    if (state === 'denied') {
        return (
            <div className="mx-4 mb-3 rounded-xl border border-ink-900/10 bg-bone-50 p-3 text-xs text-ink-700">
                Push notifications are blocked in your browser settings. Unblock to receive pings when
                you're away.
            </div>
        );
    }

    if (state === 'enabled') {
        return (
            <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-xl border border-gaming-green/30 bg-gaming-green/5 p-3 text-xs">
                <span className="flex items-center gap-2 font-semibold text-gaming-green">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-gaming-green" />
                    Push notifications on
                </span>
                <button
                    onClick={handleDisable}
                    disabled={busy}
                    className="font-semibold text-ink-500 transition hover:text-neon-red disabled:opacity-50"
                >
                    Turn off
                </button>
            </div>
        );
    }

    return (
        <div className="mx-4 mb-3 rounded-xl border border-neon-red/30 bg-neon-red/5 p-3 text-xs">
            <div className="mb-2 font-bold text-ink-900">Enable push notifications?</div>
            <p className="mb-3 leading-relaxed text-ink-700">
                Get a ping when a squad invites you, a match comes in, or someone rates you —
                even when the tab is closed.
            </p>
            <button
                onClick={handleEnable}
                disabled={busy}
                className="w-full rounded-lg bg-neon-red px-3 py-2 font-bold text-white shadow-sm transition hover:bg-neon-red/90 disabled:opacity-50"
            >
                {busy ? 'Enabling…' : 'Enable notifications'}
            </button>
        </div>
    );
}
