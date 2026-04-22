import { useEffect, useState } from 'react';

type PushType = 'new_message' | 'new_match' | 'lfg_request' | 'lfg_accepted' | 'favorite_host_lfg' | 'squad_invite' | 'role_change' | 'announcement';

const LABELS: Record<PushType, { title: string; description: string }> = {
    new_message: {
        title: 'Chat messages',
        description: 'Ping me when a friend sends me a chat message.',
    },
    new_match: {
        title: 'New matches',
        description: 'Ping me when someone I liked liked me back.',
    },
    lfg_request: {
        title: 'Squad requests',
        description: 'Ping me when someone wants to join an LFG I host.',
    },
    lfg_accepted: {
        title: 'LFG accepted',
        description: 'Ping me when my request to join a squad is accepted.',
    },
    favorite_host_lfg: {
        title: 'Favourite host LFG',
        description: 'Ping me when a host I favourited starts a new squad.',
    },
    squad_invite: {
        title: 'Previous-squad invite',
        description: "Ping me when a host I've played with reposts and invites me first.",
    },
    role_change: {
        title: 'Role changes',
        description: 'Ping me when an admin makes me a moderator or admin.',
    },
    announcement: {
        title: 'Platform announcements',
        description: "Ping me for news, release drops, and anything the team wants everyone to see.",
    },
};

function getXsrf(): string | null {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

export default function NotificationPreferences() {
    const [prefs, setPrefs] = useState<Record<PushType, boolean> | null>(null);
    const [saving, setSaving] = useState<PushType | null>(null);

    useEffect(() => {
        fetch('/notification-preferences', { credentials: 'same-origin' })
            .then((r) => r.json())
            .then((data) => setPrefs(data.push))
            .catch(() => setPrefs({
                new_message: true, new_match: true, lfg_request: true, lfg_accepted: true, favorite_host_lfg: true, squad_invite: true, role_change: true, announcement: true,
            }));
    }, []);

    async function toggle(type: PushType) {
        if (!prefs) return;
        const next = { ...prefs, [type]: !prefs[type] };
        setPrefs(next);
        setSaving(type);
        const xsrf = getXsrf();
        try {
            await fetch('/notification-preferences', {
                method: 'PUT',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                },
                body: JSON.stringify({ push: { [type]: next[type] } }),
            });
        } catch {
            // Revert on failure
            setPrefs(prefs);
        }
        setSaving(null);
    }

    if (!prefs) {
        return <div className="text-sm text-ink-500">Loading…</div>;
    }

    return (
        <section className="max-w-xl space-y-4">
            <header>
                <h2 className="text-lg font-medium text-ink-900">Push notifications</h2>
                <p className="mt-1 text-sm text-ink-500">
                    Fine-tune which kinds of events send you a push. Turning off a type stops
                    all devices you've enabled push on from pinging for it.
                </p>
            </header>

            <div className="space-y-2">
                {(Object.keys(LABELS) as PushType[]).map((type) => {
                    const enabled = prefs[type];
                    const label = LABELS[type];
                    const busy = saving === type;
                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => !busy && toggle(type)}
                            className="flex w-full items-start gap-3 rounded-xl border border-ink-900/10 bg-white p-3 text-left transition hover:bg-bone-50 disabled:opacity-60"
                            disabled={busy}
                        >
                            <div className="mt-0.5 shrink-0">
                                <div
                                    className={`flex h-5 w-9 items-center rounded-full transition ${
                                        enabled ? 'bg-neon-red' : 'bg-ink-900/20'
                                    }`}
                                >
                                    <span
                                        className={`h-4 w-4 rounded-full bg-white shadow transition ${
                                            enabled ? 'translate-x-4' : 'translate-x-0.5'
                                        }`}
                                    />
                                </div>
                            </div>
                            <div className="flex-1 text-sm">
                                <div className="font-semibold text-ink-900">{label.title}</div>
                                <div className="mt-0.5 text-xs text-ink-500">{label.description}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
