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
    traffic: TrafficStats;
}

interface TrafficStats {
    pageviews: { today: number; '7d': number; '30d': number };
    visitors: { today: number; '7d': number; '30d': number };
    top_pages: { path: string; views: number; visitors: number }[];
    series: { labels: string[]; pageviews: number[]; visitors: number[] };
}

function asArray<T>(v: unknown): T[] {
    return Array.isArray(v) ? (v as T[]) : [];
}

function sum(values: unknown): number {
    return asArray<number>(values).reduce((a, b) => a + (Number(b) || 0), 0);
}

function StatCard({
    label,
    value,
    sublabel,
    tone,
}: {
    label: string;
    value: number | string;
    sublabel?: string;
    tone?: 'red' | 'green' | 'cyan' | 'pink' | 'orange';
}) {
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

function BarChart({
    labels,
    values,
    color = '#E5484D',
}: {
    labels: string[] | undefined;
    values: number[] | undefined;
    color?: string;
}) {
    const safeValues = asArray<number>(values);
    const safeLabels = asArray<string>(labels);
    const max = Math.max(1, ...safeValues);
    return (
        <div className="flex h-40 items-end gap-[2px]">
            {safeValues.map((v, i) => {
                const pct = (v / max) * 100;
                return (
                    <div
                        key={i}
                        className="group relative flex-1 rounded-t transition hover:opacity-80"
                        style={{ height: `${pct}%`, minHeight: v > 0 ? '3px' : '1px', backgroundColor: color }}
                        title={`${safeLabels[i] ?? ''}: ${v}`}
                    >
                        <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-bold text-white group-hover:block">
                            {safeLabels[i] ?? ''}: {v}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function TrafficCard({ label, visitors, pageviews }: { label: string; visitors: number; pageviews: number }) {
    return (
        <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
            <p className="mt-1 text-2xl font-black text-gaming-cyan">{Number(visitors || 0).toLocaleString()}</p>
            <p className="text-[11px] text-ink-500">unique visitors</p>
            <p className="mt-1 text-[11px] text-ink-500">{Number(pageviews || 0).toLocaleString()} pageviews</p>
        </div>
    );
}

export default function Analytics({ headline, series, content, topGames, topRegions, traffic }: Props) {
    const safeTopGames = asArray<Props['topGames'][number]>(topGames);
    const safeTopRegions = asArray<Props['topRegions'][number]>(topRegions);
    const safeTopPages = asArray<TrafficStats['top_pages'][number]>(traffic?.top_pages);
    const maxPageViews = Math.max(1, ...safeTopPages.map((p) => p.views || 0));

    return (
        <AdminLayout>
            <Head title="Admin — Analytics" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>
                <p className="mt-1 text-sm text-ink-500">
                    Platform + website traffic from your own database — no third-party analytics, no cookies, no data leaving your server.
                </p>
            </div>

            {/* Website traffic — native tracker */}
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Website traffic</h2>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <TrafficCard label="Today" visitors={traffic?.visitors?.today ?? 0} pageviews={traffic?.pageviews?.today ?? 0} />
                <TrafficCard label="Last 7 days" visitors={traffic?.visitors?.['7d'] ?? 0} pageviews={traffic?.pageviews?.['7d'] ?? 0} />
                <TrafficCard label="Last 30 days" visitors={traffic?.visitors?.['30d'] ?? 0} pageviews={traffic?.pageviews?.['30d'] ?? 0} />
            </div>

            <div className="mb-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">Pageviews — last 30 days</h3>
                        <span className="text-xs text-ink-500">{sum(traffic?.series?.pageviews).toLocaleString()} total</span>
                    </div>
                    <BarChart labels={traffic?.series?.labels} values={traffic?.series?.pageviews} color="#06B6D4" />
                </div>
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">Unique visitors — last 30 days</h3>
                        <span className="text-xs text-ink-500">daily</span>
                    </div>
                    <BarChart labels={traffic?.series?.labels} values={traffic?.series?.visitors} color="#22C55E" />
                </div>
            </div>

            {/* Top pages */}
            <div className="mb-8 rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                <h3 className="mb-4 font-bold text-ink-900">Top pages — last 30 days</h3>
                {safeTopPages.length === 0 ? (
                    <p className="text-sm text-ink-500">
                        No pageviews tracked yet. Pages will start showing up here after the first real visit.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {safeTopPages.map((p) => {
                            const pct = ((p.views || 0) / maxPageViews) * 100;
                            return (
                                <div key={p.path} className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate font-mono text-xs text-ink-900">{p.path}</p>
                                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-900/5">
                                            <div className="h-full rounded-full bg-gaming-cyan" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-bold text-ink-900">{Number(p.views || 0).toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-500">{p.visitors} visitors</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Audience */}
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Audience</h2>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard
                    label="Total users"
                    value={headline.total_users}
                    tone="red"
                    sublabel={`${headline.total_profiles.toLocaleString()} with profile`}
                />
                <StatCard label="Online now" value={headline.online_now} tone="green" sublabel="last 15 min" />
                <StatCard label="Active today" value={headline.dau} tone="cyan" sublabel="last 24 hours (DAU)" />
                <StatCard label="Active this week" value={headline.wau} sublabel="last 7 days (WAU)" />
                <StatCard label="Active this month" value={headline.mau} sublabel="last 30 days (MAU)" />
            </div>

            {/* Signups */}
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Signups</h2>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Today" value={headline.signups_today} tone="pink" />
                <StatCard label="Last 7 days" value={headline.signups_7d} />
                <StatCard label="Last 30 days" value={headline.signups_30d} />
                <StatCard label="7d avg / day" value={(headline.signups_7d / 7).toFixed(1)} />
            </div>

            {/* Platform time series */}
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Platform activity — last 30 days</h2>
            <div className="mb-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">Signups</h3>
                        <span className="text-xs text-ink-500">{sum(series?.signups).toLocaleString()} total</span>
                    </div>
                    <BarChart labels={series?.labels} values={series?.signups} color="#E5484D" />
                </div>
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">LFG posts</h3>
                        <span className="text-xs text-ink-500">{sum(series?.lfgs).toLocaleString()} total</span>
                    </div>
                    <BarChart labels={series?.labels} values={series?.lfgs} color="#22C55E" />
                </div>
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">Matches (friendships)</h3>
                        <span className="text-xs text-ink-500">{sum(series?.matches).toLocaleString()} total</span>
                    </div>
                    <BarChart labels={series?.labels} values={series?.matches} color="#06B6D4" />
                </div>
                <div className="rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-5">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold text-ink-900">Messages</h3>
                        <span className="text-xs text-ink-500">{sum(series?.messages).toLocaleString()} total</span>
                    </div>
                    <BarChart labels={series?.labels} values={series?.messages} color="#EC4899" />
                </div>
            </div>

            {/* Platform totals */}
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
                        {safeTopGames.length === 0 && <p className="text-sm text-ink-500">No data yet.</p>}
                        {safeTopGames.map((g, i) => {
                            const max = safeTopGames[0]?.users_count || 1;
                            const pct = ((g.users_count || 0) / max) * 100;
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
                        {safeTopRegions.length === 0 && <p className="text-sm text-ink-500">No data yet.</p>}
                        {safeTopRegions.map((r, i) => {
                            const max = safeTopRegions[0]?.count || 1;
                            const pct = ((r.count || 0) / max) * 100;
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
                Pageview + platform metrics cache 2 minutes. Top lists 10 minutes. Reload the page to pick up fresher data.
            </p>
        </AdminLayout>
    );
}
