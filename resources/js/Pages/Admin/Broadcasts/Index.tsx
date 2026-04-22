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

export default function BroadcastsIndex({ broadcasts }: { broadcasts: Paginator<Row> }) {
    const { flash } = usePage().props as any;

    const destroy = (b: Row) => {
        if (!confirm(`Delete "${b.title}"? This also removes all delivery records.`)) return;
        router.delete(route('admin.broadcasts.destroy', b.id), { preserveScroll: true });
    };

    const send = (b: Row) => {
        if (!confirm(`Send "${b.title}" to the full audience now?`)) return;
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
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {b.sent_at ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gaming-green">
                                                <span className="h-1.5 w-1.5 rounded-full bg-gaming-green" />
                                                Sent {b.sent_at}
                                            </span>
                                        ) : b.scheduled_at ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gaming-orange">
                                                <span className="h-1.5 w-1.5 rounded-full bg-gaming-orange" />
                                                Scheduled {b.scheduled_at}
                                            </span>
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
                                                    className="rounded-lg bg-gaming-green/10 px-3 py-1.5 text-xs font-semibold text-gaming-green transition hover:bg-gaming-green/20"
                                                >
                                                    Send
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
