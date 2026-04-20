import { useState } from 'react';

export interface SteamStats {
    personaName?: string | null;
    avatar?: string | null;
    profileUrl?: string | null;
    visibility?: number | null;
    ownedCount: number;
    totalHours: number;
    topGames: { appid: number | null; name: string; hours: number; icon: string | null }[];
    recent: { name: string; hoursTwoWeeks: number }[];
}

interface Props {
    stats: SteamStats | null | undefined;
    isOwnProfile?: boolean;
}

function xsrf(): string | null {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

export default function SteamStatsCard({ stats: initial, isOwnProfile = false }: Props) {
    const [stats, setStats] = useState<SteamStats | null | undefined>(initial);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState<string | null>(null);

    if (!stats) return null;

    async function refresh() {
        setRefreshing(true);
        setRefreshError(null);
        try {
            const token = xsrf();
            const res = await fetch('/steam/stats/refresh', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-XSRF-TOKEN': token } : {}),
                },
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setStats(data.steamStats ?? null);
            } else {
                setRefreshError(data.error || 'Refresh failed.');
            }
        } catch {
            setRefreshError('Network error.');
        } finally {
            setRefreshing(false);
        }
    }

    const isPrivate = stats.visibility !== 3;

    return (
        <div className="rounded-xl border border-ink-900/10 bg-white p-5">
            <div className="mb-4 flex items-center gap-3">
                <svg className="h-6 w-6 text-ink-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm2.9 13.5a2.1 2.1 0 01-2.08-1.56l-2.04-.85a1.8 1.8 0 10.1-1.4l1.9.78a2.1 2.1 0 11.02 3zm-3.6-2.37l-.83-.34a2.6 2.6 0 113.37-2.9l-2.07.87zm5.05 1.2a1.42 1.42 0 11-.01-2.84 1.42 1.42 0 010 2.84z" /></svg>
                <h3 className="text-lg font-bold text-ink-900">Steam stats</h3>
                {stats.profileUrl && (
                    <a
                        href={stats.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-xs font-semibold text-neon-red hover:underline"
                    >
                        View on Steam →
                    </a>
                )}
                {isOwnProfile && (
                    <button
                        type="button"
                        onClick={refresh}
                        disabled={refreshing}
                        title="Refresh stats from Steam"
                        className={`${stats.profileUrl ? '' : 'ml-auto'} rounded-lg border border-ink-900/10 px-2.5 py-1 text-xs font-semibold text-ink-700 transition hover:border-neon-red hover:text-neon-red disabled:opacity-50`}
                    >
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                )}
            </div>

            {isPrivate ? (
                isOwnProfile ? (
                    <div className="space-y-2 rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-3 text-xs text-yellow-700">
                        <p className="font-semibold">Your Steam profile is private — teammates can't see your playtime.</p>
                        <p>
                            Open Steam → your profile → <strong>Edit Profile</strong> → <strong>Privacy Settings</strong> and set{' '}
                            <strong>Game details</strong> to <em>Public</em>. Then hit Refresh above.
                        </p>
                        {stats.profileUrl && (
                            <a
                                href={stats.profileUrl.replace(/\/$/, '') + '/edit/settings'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block font-semibold underline hover:text-yellow-800"
                            >
                                Open my Steam privacy settings →
                            </a>
                        )}
                    </div>
                ) : (
                    <p className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-3 text-xs text-yellow-700">
                        This Steam profile is set to private — only the linked account is visible. Ask the player to make their game details public to show playtime.
                    </p>
                )
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-ink-900/10 bg-bone-50 p-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Games owned</div>
                            <div className="mt-1 text-2xl font-black text-ink-900">{stats.ownedCount}</div>
                        </div>
                        <div className="rounded-lg border border-ink-900/10 bg-bone-50 p-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Total hours</div>
                            <div className="mt-1 text-2xl font-black text-ink-900">{stats.totalHours.toLocaleString()}</div>
                        </div>
                        {stats.recent.length > 0 && (
                            <div className="col-span-2 rounded-lg border border-ink-900/10 bg-bone-50 p-3 sm:col-span-1">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Last 2 weeks</div>
                                <div className="mt-1 truncate text-sm font-semibold text-ink-900">
                                    {stats.recent[0].name}
                                </div>
                                <div className="text-xs text-ink-500">{stats.recent[0].hoursTwoWeeks}h this fortnight</div>
                            </div>
                        )}
                    </div>

                    {stats.topGames.length > 0 && (
                        <div>
                            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-ink-500">Most played</div>
                            <div className="space-y-1.5">
                                {stats.topGames.map((g) => (
                                    <div key={g.appid ?? g.name} className="flex items-center gap-3 rounded-lg border border-ink-900/5 bg-white px-3 py-2">
                                        {g.icon && (
                                            <img src={g.icon} alt="" className="h-8 w-8 rounded" loading="lazy" />
                                        )}
                                        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-900">{g.name}</div>
                                        <div className="shrink-0 text-xs font-bold text-neon-red">{g.hours.toLocaleString()}h</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {refreshError && <p className="mt-3 text-xs text-red-500">{refreshError}</p>}
        </div>
    );
}
