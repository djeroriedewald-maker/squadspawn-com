import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface PendingEvent {
    id: number;
    slug: string;
    title: string;
    type: string;
    body_html: string | null;
    cover_image: string | null;
    scheduled_for: string;
    region: string | null;
    max_capacity: number | null;
    external_link: string | null;
    video_url: string | null;
    created_at: string;
    host: { id: number; name: string; profile?: { username?: string; avatar?: string } };
    game?: { id: number; name: string; slug: string } | null;
}

interface RecentEvent {
    id: number;
    slug: string;
    title: string;
    status: string;
    rejected_reason: string | null;
    updated_at: string;
    host: { id: number; name: string; profile?: { username?: string } };
    approver?: { id: number; name: string } | null;
}

const TYPE_LABEL: Record<string, string> = {
    tournament: 'Tournament',
    livestream: 'Watch party',
    giveaway: 'Giveaway',
    meetup: 'Meetup',
    training: 'Training',
    other: 'Other',
};

export default function EventsQueue({ pending, recent }: { pending: PendingEvent[]; recent: RecentEvent[] }) {
    const [rejecting, setRejecting] = useState<number | null>(null);
    const [reason, setReason] = useState('');

    const approve = (event: PendingEvent) => {
        if (!confirm(`Approve "${event.title}"? It'll go live immediately.`)) return;
        router.post(route('admin.events.approve', event.slug), {}, { preserveScroll: true });
    };

    const submitReject = (event: PendingEvent) => {
        if (!reason.trim()) { alert('Add a reason so the host knows what to fix.'); return; }
        router.post(route('admin.events.reject', event.slug), { reason }, {
            preserveScroll: true,
            onSuccess: () => { setRejecting(null); setReason(''); },
        });
    };

    return (
        <AdminLayout>
            <Head title="Events queue · Admin" />

            <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink-900">Events queue</h1>
                    <p className="mt-1 text-sm text-ink-500">
                        {pending.length === 0 ? 'No events waiting.' : `${pending.length} event${pending.length === 1 ? '' : 's'} awaiting your call.`}
                    </p>
                </div>
            </div>

            {pending.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-12 text-center">
                    <p className="text-sm font-semibold text-ink-900">Queue empty.</p>
                    <p className="mt-1 text-xs text-ink-500">New host submissions will land here for review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pending.map((event) => (
                        <article key={event.id} className="overflow-hidden rounded-2xl border border-ink-900/10 bg-white">
                            <div className="grid gap-4 p-5 sm:grid-cols-[160px_1fr]">
                                <img
                                    src={event.cover_image || '/images/event_banner.jpg'}
                                    alt=""
                                    className="h-24 w-40 flex-shrink-0 rounded-lg border border-ink-900/10 object-cover"
                                />
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                        <span className="rounded-full bg-gaming-cyan/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-gaming-cyan">
                                            {TYPE_LABEL[event.type] ?? event.type}
                                        </span>
                                        <h2 className="text-lg font-bold text-ink-900">{event.title}</h2>
                                    </div>
                                    <p className="mt-1 text-xs text-ink-500">
                                        Hosted by <Link href={route('player.show', event.host.profile?.username || event.host.name)} className="font-semibold text-ink-700 hover:text-neon-red">
                                            {event.host.profile?.username || event.host.name}
                                        </Link>
                                        {' · submitted '}{new Date(event.created_at).toLocaleString()}
                                    </p>
                                    <p className="mt-2 text-xs text-ink-700">
                                        Starts {new Date(event.scheduled_for).toLocaleString()}
                                        {event.region && <> · {event.region}</>}
                                        {event.game && <> · {event.game.name}</>}
                                        {event.max_capacity && <> · max {event.max_capacity}</>}
                                    </p>
                                    {event.body_html && (
                                        <div
                                            className="prose prose-sm mt-3 max-w-none text-ink-700"
                                            dangerouslySetInnerHTML={{ __html: event.body_html }}
                                        />
                                    )}
                                    {(event.external_link || event.video_url) && (
                                        <div className="mt-3 flex flex-wrap gap-3 text-xs">
                                            {event.external_link && (
                                                <a href={event.external_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-ink-900/15 px-2 py-1 text-ink-700 hover:border-neon-red/40 hover:text-neon-red">
                                                    External link ↗
                                                </a>
                                            )}
                                            {event.video_url && (
                                                <a href={event.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded border border-ink-900/15 px-2 py-1 text-ink-700 hover:border-neon-red/40 hover:text-neon-red">
                                                    Video ↗
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 border-t border-ink-900/10 bg-bone-50 px-5 py-3">
                                <button
                                    type="button"
                                    onClick={() => approve(event)}
                                    className="rounded-lg bg-gaming-green px-4 py-2 text-sm font-bold text-white transition hover:bg-gaming-green/90"
                                >
                                    Approve
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setRejecting(event.id); setReason(''); }}
                                    className="rounded-lg border border-red-500/30 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500/5"
                                >
                                    Reject
                                </button>
                                <Link
                                    href={route('events.show', event.slug)}
                                    className="ml-auto text-xs font-semibold text-ink-500 hover:text-neon-red"
                                >
                                    Preview as user →
                                </Link>
                            </div>

                            {rejecting === event.id && (
                                <div className="border-t border-ink-900/10 bg-white p-5">
                                    <label className="block text-xs font-bold text-ink-900">Reason (the host will see this)</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        className="mt-1 w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-red-500/40 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                        placeholder="e.g. Cover image violates trademark / promo links to crypto / dates are in the past."
                                    />
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => submitReject(event)}
                                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500/90"
                                        >
                                            Confirm reject
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setRejecting(null); setReason(''); }}
                                            className="rounded-lg border border-ink-900/15 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-neon-red/30"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}

            {recent.length > 0 && (
                <section className="mt-12">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-ink-500">Recent decisions</h2>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-ink-900/10 bg-white">
                        <table className="w-full text-sm">
                            <tbody className="divide-y divide-ink-900/5">
                                {recent.map((event) => (
                                    <tr key={event.id} className="hover:bg-bone-50">
                                        <td className="p-3">
                                            <Link href={route('events.show', event.slug)} className="font-semibold text-ink-900 hover:text-neon-red">{event.title}</Link>
                                            <p className="text-xs text-ink-500">{event.host.profile?.username || event.host.name}</p>
                                        </td>
                                        <td className="p-3 text-xs">
                                            <span className={`rounded-full px-2 py-0.5 font-bold uppercase tracking-widest ${
                                                event.status === 'published' ? 'bg-gaming-green/15 text-gaming-green'
                                                : event.status === 'rejected' ? 'bg-red-500/15 text-red-500'
                                                : 'bg-ink-900/10 text-ink-500'
                                            }`}>
                                                {event.status}
                                            </span>
                                            {event.rejected_reason && <p className="mt-1 text-ink-500">"{event.rejected_reason}"</p>}
                                        </td>
                                        <td className="p-3 text-right text-xs text-ink-500">
                                            {event.approver && <>by {event.approver.name} · </>}
                                            {new Date(event.updated_at).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </AdminLayout>
    );
}
