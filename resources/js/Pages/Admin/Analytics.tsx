import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

interface Props {
    headline: {
        total_users: number;
        total_profiles: number;
        signups_today: number;
        signups_7d: number;
        signups_30d: number;
        dau: number;
        wau: number;
        mau: number;
        online_now: number;
    };
    series: {
        labels: string[];
        signups: number[];
        lfgs: number[];
        matches: number[];
        messages: number[];
    };
    content: {
        lfgs_total: number;
        lfgs_open: number;
        matches_total: number;
        messages_total: number;
        community_posts_total: number;
        clips_total: number;
        ratings_total: number;
    };
    topGames: { id: number; name: string; slug: string; cover_image?: string | null; users_count: number }[];
    topRegions: { region: string; count: number }[];
    plausibleDomain: string;
}

function StatCard({ label, value, sublabel, tone }: { label: string; value: number | string; sublabel?: string; tone?: 'red' | 'green' | 'cyan' | 'pink' | 'orange' }) {
    const toneMap: Record<string, string> = {
        red: 'text-neon-red',
        green: 'text-gaming-green',
        cyan: 'text-gaming-cyan',
        pink: 'text-gaming-pink',
        orange: 'text-gaming-orange',
    };
    const valueClass = tone ? toneMap[tone] : 'text-ink-900';
    return (
        <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-black ${valueClass}`}>
                {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {sublabel && <p className="text-[11px] text-ink-500">{sublabel}</p>}
        </div>
    );
}

function BarChart({ labels, values, color = '#E5484D' }: { labels: string[]; values: number[]; color?: string }) {
    const max = Math.max(1, ...values);
    return (
        <div className="flex h-40 items-end gap-[2px]">
            {values.map((v, i) => {
                const pct = (v / max) * 100;
                return (
                    <div
                        key={i}
                        className="group relative flex-1 rounded-t transition hover:opacity-80"
                        style={{ height: `${pct}%`, minHeight: v > 0 ? '3px' : '1px', backgroundColor: color }}
                        title={`${labels[i]}: ${v}`}
                    >
                        <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block">
                            {labels[i]}: {v}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default function Analytics({ headline, series, content, topGames, topRegions, plausibleDomain }: Props) {
    return (
        <AdminLayout>
            <Head title="Admin — Analytics" />

            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Platform activity from the database. Visitor-side data (pageviews, sources, countries) lives on your Plausible dashboard.
                    </p>
                </div>
                <a
                    href={`https://plausible.io/${plausibleDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-gaming-cyan/10 px-4 py-2.5 text-sm font-semibold text-gaming-cyan transition hover:bg-gaming-cyan/20"
                >
                    Open Plausible
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                </a>
            </div>

            {/* Headline — audience */}
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Audience</h2>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard label="Total users" value={headline.total_users} tone="red" sublabel={`${headline.total_profiles.toLocaleString()} with profile`} />
                <StatCard label="Online now" value={headline.online_now} tone="green" sublabel="last 15 min" />
                <StatCard label="Active today" value={headline.dau} tone="cyan" sublabel="last 24 hours (DAU)" />
                <StatCard label="Active this week" value={headline.wau} sublabel="last 7 days (WAU)" />
                <StatCard label="Active this month" value={headline.mau} sublabel="last 30 days (MAU)" />
            </div>

            {/* Headline — signups */}
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Signups</h2>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Today" value={headline.signups_today} tone="pink" />
                <StatCard label="Last 7 days" value={headline.signups_7d} />
                <StatCard label="Last 30 days" value={headline.signups_30d} />
                <StatCard
                    label="7d avg / day"
                    value={(headline.signups_7d / 7).toFixed(1)}
                />
            </div>

            {/* Time series */}
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Last 30 days</h2>
            <div className="mb-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">Signups</h3>
                        <span className="text-xs text-ink-500">{series.signups.reduce((a, b) => a + b, 0)} total</span>
                    </div>
                    <BarChart labels={series.labels} values={series.signups} color="#E5484D" />
                </div>
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">LFG posts</h3>
                        <span className="text-xs text-ink-500">{series.lfgs.reduce((a, b) => a + b, 0)} total</span>
                    </div>
                    <BarChart labels={series.labels} values={series.lfgs} color="#22C55E" />
                </div>
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">Matches (friendships)</h3>
                        <span className="text-xs text-ink-500">{series.matches.reduce((a, b) => a + b, 0)} total</span>
                    </div>
                    <BarChart labels={series.labels} values={series.matches} color="#06B6D4" />
                </div>
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">Messages</h3>
                        <span className="text-xs text-ink-500">{series.messages.reduce((a, b) => a + b, 0)} total</span>
                    </div>
                    <BarChart labels={series.labels} values={series.messages} color="#EC4899" />
                </div>
            </div>

            {/* Content totals */}
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Platform totals</h2>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                <StatCard label="LFGs total" value={content.lfgs_total} />
                <StatCard label="LFGs open" value={content.lfgs_open} tone="green" />
                <StatCard label="Matches" value={content.matches_total} tone="cyan" />
                <StatCard label="Messages" value={content.messages_total} />
                <StatCard label="Community posts" value={content.community_posts_total} />
                <StatCard label="Clips" value={content.clips_total} tone="pink" />
                <StatCard label="Ratings" value={content.ratings_total} tone="orange" />
            </div>

            {/* Top games + regions */}
            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <h3 className="mb-4 font-bold text-ink-900">Top games by players</h3>
                    <div className="space-y-2">
                        {topGames.length === 0 && (
                            <p className="text-sm text-ink-500">No data yet.</p>
                        )}
                        {topGames.map((g, i) => {
                            const max = topGames[0]?.users_count || 1;
                            const pct = (g.users_count / max) * 100;
                            return (
                                <div key={g.id} className="flex items-center gap-3">
                                    <span className="w-5 shrink-0 text-center text-xs font-bold text-gray-500">#{i + 1}</span>
                                    <img src={g.cover_image || `/images/games/${g.slug}.svg`} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium text-ink-900">{g.name}</p>
                                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/5">
                                            <div className="h-full rounded-full bg-neon-red" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-sm font-bold text-ink-900">{g.users_count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <h3 className="mb-4 font-bold text-ink-900">Top regions</h3>
                    <div className="space-y-2">
                        {topRegions.length === 0 && (
                            <p className="text-sm text-ink-500">No data yet.</p>
                        )}
                        {topRegions.map((r, i) => {
                            const max = topRegions[0]?.count || 1;
                            const pct = (r.count / max) * 100;
                            return (
                                <div key={r.region} className="flex items-center gap-3">
                                    <span className="w-5 shrink-0 text-center text-xs font-bold text-gray-500">#{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate text-sm font-medium text-ink-900">{r.region}</p>
                                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/5">
                                            <div className="h-full rounded-full bg-gaming-cyan" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-sm font-bold text-ink-900">{r.count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <p className="mt-6 text-[11px] text-gray-500">
                Headline metrics cache 2 minutes. Time-series + content totals 5 minutes. Top lists 10 minutes. A manual refresh via page reload picks up fresher data.
            </p>
        </AdminLayout>
    );
}
