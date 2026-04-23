import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface Row {
    id: number;
    title: string;
    style: 'popup' | 'banner';
    push_enabled: boolean;
    scheduled_at: string | null;
    sent_at: string | null;
    audience: number;
    viewed: number;
    clicked: number;
    dismissed: number;
    push_eligible: number;
    push_sent: number;
    author_name?: string | null;
}

interface Paginator<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    last_page: number;
}

/**
 * Compact "25 Apr, 14:03" formatter.
 *
 * The backend stores timestamps in UTC (app.timezone = UTC) and
 * serialises them as "2026-04-23 07:12:00" without a zone suffix.
 * Plain `new Date("2026-04-23T07:12:00")` would interpret that as
 * local time — so 07:12 UTC would render as 07:12 CEST, two hours
 * off. Appending "Z" before parsing tells JS it's UTC; toLocaleString
 * then converts it to the viewer's own timezone for display.
 */
function formatDateTime(iso: string | null): string {
    if (!iso) return '';
    const normalised = iso.includes('T') ? iso : iso.replace(' ', 'T');
    const withZone = /[Zz]|[+-]\d{2}:?\d{2}$/.test(normalised) ? normalised : normalised + 'Z';
    const d = new Date(withZone);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

interface SchedulerHealth {
    last_run_at: string | null;
    healthy: boolean;
}

export default function BroadcastsIndex({ broadcasts, scheduler }: { broadcasts: Paginator<Row>; scheduler: SchedulerHealth }) {
    const { flash } = usePage().props as any;

    const destroy = (b: Row) => {
        if (!confirm(`Delete "${b.title}"? This also removes all delivery records.`)) return;
        router.delete(route('admin.broadcasts.destroy', b.id), { preserveScroll: true });
    };

    const send = (b: Row) => {
        const prompt = b.scheduled_at
            ? `Fire "${b.title}" right now? This skips the scheduled time (${formatDateTime(b.scheduled_at)}) and delivers immediately.`
            : `Send "${b.title}" to the full audience now?`;
        if (!confirm(prompt)) return;
        router.post(route('admin.broadcasts.send', b.id), {}, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Broadcasts · Admin" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Broadcasts</h1>
                    <p className="mt-1 text-sm text-ink-500">Send popups + push notifications. Segment by game, region, or level.</p>
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

            <div className="mb-6 flex gap-1 border-b border-ink-900/10">
                <Link
                    href={route('admin.broadcasts.index')}
                    className="relative px-4 py-2 text-sm font-semibold text-ink-900"
                >
                    All broadcasts
                    <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-t bg-neon-red" />
                </Link>
                <Link
                    href={route('admin.broadcasts.analytics')}
                    className="px-4 py-2 text-sm font-semibold text-ink-500 transition hover:text-ink-700"
                >
                    Analytics
                </Link>
            </div>

            {/* Scheduler heartbeat panel — tells you immediately whether
                the cron on Forge is actually firing schedule:run. */}
            <div
                className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${
                    scheduler.healthy
                        ? 'border-gaming-green/30 bg-gaming-green/5'
                        : 'border-gaming-orange/40 bg-gaming-orange/5'
                }`}
            >
                <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                    scheduler.healthy ? 'bg-gaming-green/20 text-gaming-green' : 'bg-gaming-orange/20 text-gaming-orange'
                }`}>
                    {scheduler.healthy ? (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                    ) : (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M5.07 19.5h13.86a2.25 2.25 0 0 0 1.95-3.375L13.95 3.375a2.25 2.25 0 0 0-3.9 0L3.12 16.125A2.25 2.25 0 0 0 5.07 19.5Z" />
                        </svg>
                    )}
                </div>
                <div className="flex-1 text-xs">
                    <p className={`font-semibold ${scheduler.healthy ? 'text-gaming-green' : 'text-gaming-orange'}`}>
                        Scheduler: {scheduler.healthy ? 'running' : 'not running'}
                    </p>
                    <p className="mt-0.5 text-ink-500">
                        {scheduler.last_run_at
                            ? <>Last heartbeat at <strong className="text-ink-700">{new Date(scheduler.last_run_at).toLocaleString()}</strong>. Scheduled broadcasts fire within a minute of their planned time.</>
                            : <>No heartbeat recorded yet. Configure a cron on Forge: <code className="rounded bg-bone-100 px-1 py-0.5">php /home/forge/squadspawn.com/artisan schedule:run</code> — every minute.</>}
                    </p>
                    {!scheduler.healthy && (
                        <p className="mt-1 text-ink-500">
                            <Link href={route('admin.broadcasts.diagnostics')} className="font-semibold text-neon-red hover:underline">
                                Open diagnostics →
                            </Link>{' '}
                            for the exact cron command + server paths.
                        </p>
                    )}
                </div>
            </div>

            {flash?.message && (
                <div className="mb-6 rounded-lg border border-gaming-green/40 bg-gaming-green/10 px-4 py-2.5 text-sm font-semibold text-gaming-green">
                    {flash.message}
                </div>
            )}

            {broadcasts.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-14 text-center">
                    <p className="text-sm text-ink-500">No broadcasts yet. Hit <em>New broadcast</em> to create your first one.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-ink-900/10 bg-bone-100 text-[11px] uppercase tracking-widest text-ink-500">
                            <tr>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Stats</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {broadcasts.data.map((b) => (
                                <tr key={b.id} className="border-b border-ink-900/5 last:border-b-0 hover:bg-bone-100/60">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-ink-900">{b.title}</span>
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
                                            {/* A "scheduled" tag stays on the broadcast
                                                even after it's been sent, so it's
                                                always clear whether it fired manually
                                                or via the cron. */}
                                            {b.scheduled_at && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-gaming-orange/10 px-2 py-0.5 text-[10px] font-semibold text-gaming-orange">
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                    </svg>
                                                    Scheduled
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {b.sent_at ? (
                                            <div className="space-y-0.5">
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gaming-green">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-gaming-green" />
                                                    Sent {formatDateTime(b.sent_at)}
                                                </span>
                                                {b.scheduled_at && (
                                                    <div className="text-[10px] text-ink-500">
                                                        ⏱ Planned for {formatDateTime(b.scheduled_at)}
                                                    </div>
                                                )}
                                            </div>
                                        ) : b.scheduled_at ? (
                                            <div className="space-y-0.5">
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gaming-orange">
                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gaming-orange" />
                                                    Fires {formatDateTime(b.scheduled_at)}
                                                </span>
                                                <div className="text-[10px] text-ink-500">
                                                    Waiting on the scheduler
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500">
                                                <span className="h-1.5 w-1.5 rounded-full bg-ink-500" />
                                                Draft
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-ink-700">
                                        {b.sent_at ? (
                                            <div className="space-y-0.5">
                                                <div>
                                                    <span className="font-semibold">{b.viewed}</span>
                                                    <span className="text-ink-500">/{b.audience} viewed</span>
                                                </div>
                                                <div className="text-[10px] text-ink-500">
                                                    {b.clicked} clicked · {b.dismissed} dismissed
                                                </div>
                                                {b.push_enabled && (
                                                    <div className="text-[10px] text-gaming-orange">
                                                        📱 {b.push_sent}/{b.push_eligible} push delivered
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-ink-500">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {!b.sent_at && (
                                                <button
                                                    type="button"
                                                    onClick={() => send(b)}
                                                    title={b.scheduled_at ? 'Fire now instead of waiting for the scheduler.' : 'Dispatch this draft immediately.'}
                                                    className="rounded-lg bg-gaming-green/10 px-3 py-1.5 text-xs font-semibold text-gaming-green transition hover:bg-gaming-green/20"
                                                >
                                                    {b.scheduled_at ? 'Send now' : 'Send'}
                                                </button>
                                            )}
                                            {!b.sent_at && (
                                                <Link
                                                    href={route('admin.broadcasts.edit', b.id)}
                                                    className="rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => destroy(b)}
                                                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-500/20"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminLayout>
    );
}
