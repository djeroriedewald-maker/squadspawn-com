import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

interface Row {
    id: number;
    title: string;
    style: 'popup' | 'banner';
    push_enabled: boolean;
    sent_at: string | null;
    sent_at_human: string | null;
    audience: number;
    viewed: number;
    clicked: number;
    dismissed: number;
    push_eligible: number;
    push_sent: number;
    view_rate: number | null;
    click_rate: number | null;
    author_name: string | null;
}

interface Totals {
    sent_count: number;
    total_audience: number;
    total_viewed: number;
    total_clicked: number;
    total_dismissed: number;
    total_push_sent: number;
    total_push_eligible: number;
    view_rate: number | null;
    click_rate: number | null;
    push_rate: number | null;
}

export default function BroadcastAnalytics({
    broadcasts,
    totals,
}: {
    broadcasts: Row[];
    totals: Totals;
}) {
    return (
        <AdminLayout>
            <Head title="Broadcast analytics · Admin" />

            {/* ── Header + tab nav ────────────────────────────── */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Broadcast analytics</h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Engagement across every sent broadcast. Updated in real time as users view, click, and dismiss.
                    </p>
                </div>
                <Link
                    href={route('admin.broadcasts.create')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-4 py-2.5 text-sm font-semibold text-white shadow-glow-red transition hover:bg-neon-red/90"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New broadcast
                </Link>
            </div>

            <TabNav active="analytics" />

            {totals.sent_count === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-14 text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neon-red/10 text-neon-red">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                        </svg>
                    </div>
                    <h3 className="text-base font-bold text-ink-900">No data yet</h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500">
                        Send your first broadcast and this page will come alive with view, click, and push-delivery stats.
                    </p>
                </div>
            ) : (
                <>
                    {/* ── Aggregate KPIs ────────────────────────── */}
                    <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Kpi
                            label="Broadcasts sent"
                            value={totals.sent_count.toLocaleString()}
                            hint="Total delivered to date"
                            accent="neon"
                        />
                        <Kpi
                            label="Total reach"
                            value={totals.total_audience.toLocaleString()}
                            hint={`${totals.total_viewed.toLocaleString()} viewed`}
                            accent="cyan"
                        />
                        <Kpi
                            label="View rate"
                            value={totals.view_rate !== null ? `${totals.view_rate}%` : '—'}
                            hint={`${totals.total_viewed.toLocaleString()} / ${totals.total_audience.toLocaleString()}`}
                            progress={totals.view_rate ?? 0}
                            accent="green"
                        />
                        <Kpi
                            label="Click-through"
                            value={totals.click_rate !== null ? `${totals.click_rate}%` : '—'}
                            hint={`${totals.total_clicked.toLocaleString()} clicks`}
                            progress={totals.click_rate ?? 0}
                            accent="orange"
                        />
                    </div>

                    <div className="mb-8 grid gap-3 sm:grid-cols-3">
                        <MiniStat label="Dismissed" value={totals.total_dismissed.toLocaleString()} />
                        <MiniStat label="Push eligible" value={totals.total_push_eligible.toLocaleString()} hint="Users with a push subscription in a targeted broadcast" />
                        <MiniStat
                            label="Push delivered"
                            value={`${totals.total_push_sent.toLocaleString()}${totals.push_rate !== null ? ` (${totals.push_rate}%)` : ''}`}
                            hint={totals.push_rate !== null ? 'of eligible users' : undefined}
                        />
                    </div>

                    {/* ── Per-broadcast breakdown ────────────────── */}
                    <div className="rounded-2xl border border-ink-900/10 bg-white">
                        <div className="flex items-center justify-between border-b border-ink-900/10 px-6 py-4">
                            <h2 className="text-sm font-bold text-ink-900">Per-broadcast breakdown</h2>
                            <span className="text-[11px] text-ink-500">Showing last {broadcasts.length} sent</span>
                        </div>

                        <ol className="divide-y divide-ink-900/5">
                            {broadcasts.map((b) => (
                                <li key={b.id} className="px-6 py-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={route('admin.broadcasts.edit', b.id)}
                                                    className="text-base font-bold text-ink-900 transition hover:text-neon-red"
                                                >
                                                    {b.title}
                                                </Link>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                                    b.style === 'popup'
                                                        ? 'bg-neon-red/15 text-neon-red'
                                                        : 'bg-gaming-cyan/15 text-gaming-cyan'
                                                }`}>
                                                    {b.style}
                                                </span>
                                                {b.push_enabled && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-gaming-orange/10 px-2 py-0.5 text-[10px] font-semibold text-gaming-orange">
                                                        📱 push
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 text-[11px] text-ink-500">
                                                {b.sent_at_human} · by {b.author_name ?? 'unknown'}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-xs">
                                            <NumberBlock label="Reach" value={b.audience.toLocaleString()} />
                                            <NumberBlock
                                                label="Viewed"
                                                value={`${b.viewed.toLocaleString()}${b.view_rate !== null ? ` · ${b.view_rate}%` : ''}`}
                                            />
                                            <NumberBlock
                                                label="Clicks"
                                                value={`${b.clicked.toLocaleString()}${b.click_rate !== null ? ` · ${b.click_rate}%` : ''}`}
                                            />
                                            <NumberBlock label="Dismissed" value={b.dismissed.toLocaleString()} />
                                            {b.push_enabled && (
                                                <NumberBlock
                                                    label="Push"
                                                    value={`${b.push_sent}/${b.push_eligible}`}
                                                    accent="orange"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress bars */}
                                    <div className="mt-4 space-y-2">
                                        <ProgressRow
                                            label="Viewed"
                                            percent={b.view_rate}
                                            color="bg-gaming-green"
                                        />
                                        <ProgressRow
                                            label="Clicked (of viewers)"
                                            percent={b.click_rate}
                                            color="bg-gaming-orange"
                                        />
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </>
            )}
        </AdminLayout>
    );
}

// ── Pieces ─────────────────────────────────────────────────────

function TabNav({ active }: { active: 'list' | 'analytics' }) {
    const tabs: { key: 'list' | 'analytics'; label: string; href: string }[] = [
        { key: 'list', label: 'All broadcasts', href: route('admin.broadcasts.index') },
        { key: 'analytics', label: 'Analytics', href: route('admin.broadcasts.analytics') },
    ];
    return (
        <div className="mb-6 flex gap-1 border-b border-ink-900/10">
            {tabs.map((t) => (
                <Link
                    key={t.key}
                    href={t.href}
                    className={`relative px-4 py-2 text-sm font-semibold transition ${
                        active === t.key ? 'text-ink-900' : 'text-ink-500 hover:text-ink-700'
                    }`}
                >
                    {t.label}
                    {active === t.key && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-t bg-neon-red" />}
                </Link>
            ))}
        </div>
    );
}

function Kpi({
    label,
    value,
    hint,
    progress,
    accent = 'neon',
}: {
    label: string;
    value: string;
    hint?: string;
    progress?: number;
    accent?: 'neon' | 'cyan' | 'green' | 'orange';
}) {
    const accentColor = {
        neon: 'from-neon-red/10 to-transparent text-neon-red',
        cyan: 'from-gaming-cyan/10 to-transparent text-gaming-cyan',
        green: 'from-gaming-green/10 to-transparent text-gaming-green',
        orange: 'from-gaming-orange/10 to-transparent text-gaming-orange',
    }[accent];
    const barColor = {
        neon: 'bg-neon-red',
        cyan: 'bg-gaming-cyan',
        green: 'bg-gaming-green',
        orange: 'bg-gaming-orange',
    }[accent];

    return (
        <div className={`relative overflow-hidden rounded-2xl border border-ink-900/10 bg-gradient-to-br bg-white p-5 ${accentColor}`}>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-ink-900">{value}</p>
            {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
            {progress !== undefined && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bone-100">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                </div>
            )}
        </div>
    );
}

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
    return (
        <div className="rounded-xl border border-ink-900/10 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-ink-900">{value}</p>
            {hint && <p className="mt-0.5 text-[10px] text-ink-500">{hint}</p>}
        </div>
    );
}

function NumberBlock({ label, value, accent }: { label: string; value: string; accent?: 'orange' }) {
    return (
        <div className="min-w-[72px]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">{label}</p>
            <p className={`mt-0.5 text-sm font-bold ${accent === 'orange' ? 'text-gaming-orange' : 'text-ink-900'}`}>{value}</p>
        </div>
    );
}

function ProgressRow({ label, percent, color }: { label: string; percent: number | null; color: string }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-ink-500">{label}</span>
                <span className="font-semibold text-ink-700">{percent !== null ? `${percent}%` : '—'}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bone-100">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${percent !== null ? Math.min(100, Math.max(0, percent)) : 0}%` }} />
            </div>
        </div>
    );
}
