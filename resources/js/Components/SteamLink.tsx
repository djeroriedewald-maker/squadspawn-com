import { useEffect, useState } from 'react';

interface LinkStatus {
    available: boolean;
    linked: boolean;
    steamId?: string | null;
    personaName?: string | null;
    avatar?: string | null;
    profileUrl?: string | null;
    visibility?: number | null;
}

function xsrf(): string | null {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

async function api(url: string, method: string, body?: unknown) {
    const token = xsrf();
    return fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(token ? { 'X-XSRF-TOKEN': token } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
}

export default function SteamLink() {
    const [status, setStatus] = useState<LinkStatus | null>(null);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function load() {
        const res = await api('/steam/link', 'GET');
        if (res.ok) setStatus(await res.json());
    }

    useEffect(() => { load(); }, []);

    async function link() {
        if (!input.trim()) return;
        setBusy(true);
        setError(null);
        const res = await api('/steam/link', 'POST', { input: input.trim() });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setStatus({ ...(status || { available: true }), ...data });
            setInput('');
        } else {
            setError(data.error || 'Linking failed.');
        }
        setBusy(false);
    }

    async function unlink() {
        if (!window.confirm('Unlink your Steam account? Your stats will disappear from your profile.')) return;
        setBusy(true);
        await api('/steam/link', 'DELETE');
        await load();
        setBusy(false);
    }

    if (!status) {
        return <div className="text-sm text-ink-500">Loading…</div>;
    }

    if (!status.available) {
        return (
            <section className="max-w-xl space-y-3">
                <header>
                    <h2 className="text-lg font-medium text-ink-900">Steam account</h2>
                </header>
                <p className="rounded-lg border border-ink-900/10 bg-bone-50 p-3 text-xs text-ink-500">
                    Steam integration isn't configured on this server yet.
                </p>
            </section>
        );
    }

    return (
        <section className="max-w-xl space-y-4">
            <header>
                <h2 className="text-lg font-medium text-ink-900">Steam account</h2>
                <p className="mt-1 text-sm text-ink-500">
                    Link your Steam profile to show real playtime and recent activity to potential teammates.
                </p>
            </header>

            {status.linked ? (
                <div className="flex items-center gap-3 rounded-xl border border-gaming-green/30 bg-gaming-green/5 p-3">
                    {status.avatar && (
                        <img src={status.avatar} alt="" className="h-10 w-10 rounded-full" />
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="h-1.5 w-1.5 rounded-full bg-gaming-green" />
                            <span className="font-semibold text-ink-900">{status.personaName || 'Linked'}</span>
                            {status.visibility !== 3 && (
                                <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-600">
                                    Profile private — games won't show
                                </span>
                            )}
                        </div>
                        <div className="truncate text-xs text-ink-500">
                            {status.profileUrl && (
                                <a href={status.profileUrl} target="_blank" rel="noopener noreferrer" className="hover:text-neon-red hover:underline">
                                    {status.profileUrl}
                                </a>
                            )}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={unlink}
                        disabled={busy}
                        className="shrink-0 rounded-lg border border-ink-900/10 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-neon-red hover:text-neon-red disabled:opacity-50"
                    >
                        Unlink
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-ink-700">Your Steam profile URL or SteamID64</label>
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="https://steamcommunity.com/id/yourname"
                            className="flex-1 rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                        />
                        <button
                            type="button"
                            onClick={link}
                            disabled={busy || !input.trim()}
                            className="rounded-lg bg-neon-red px-4 py-2 text-sm font-bold text-white transition hover:bg-neon-red/90 disabled:opacity-50"
                        >
                            {busy ? 'Linking…' : 'Link Steam'}
                        </button>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <p className="text-xs text-ink-500">
                        Paste a profile URL (<code className="rounded bg-ink-900/5 px-1">/id/name</code> or <code className="rounded bg-ink-900/5 px-1">/profiles/7656…</code>),
                        your custom URL name, or a raw SteamID64. Keep your Steam profile set to public so your games actually show up.
                    </p>
                </div>
            )}
        </section>
    );
}
