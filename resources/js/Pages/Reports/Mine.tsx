import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface ReportRow {
    id: number;
    reason: string;
    details?: string | null;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
    reported_name?: string | null;
    target?: {
        type: 'community_post' | 'post_comment' | 'lfg_post';
        title: string;
        url?: string | null;
    } | null;
}

const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-yellow-400/20 text-yellow-600',
    reviewed: 'bg-gaming-cyan/20 text-gaming-cyan',
    resolved: 'bg-gaming-green/20 text-gaming-green',
};

const STATUS_COPY: Record<string, string> = {
    pending: 'Waiting for a mod to review',
    reviewed: 'A mod has seen this — no action taken or decision pending',
    resolved: 'Resolved by a mod — thanks for reporting',
};

const TARGET_LABEL: Record<string, string> = {
    community_post: 'Community post',
    post_comment: 'Comment',
    lfg_post: 'LFG post',
};

export default function MyReports({ reports }: { reports: ReportRow[] }) {
    return (
        <AuthenticatedLayout>
            <Head title="My Reports" />

            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-ink-900">My Reports</h1>
                    <p className="mt-2 text-sm text-ink-500">
                        Everything you've flagged, and what happened to it.
                    </p>
                </div>

                {reports.length === 0 ? (
                    <div className="rounded-xl border border-ink-900/10 bg-white p-10 text-center text-sm text-ink-500">
                        You haven't filed any reports. If something's off, use the Report button on a post or profile.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reports.map((r) => (
                            <div key={r.id} className="rounded-xl border border-ink-900/10 bg-white p-4">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[r.status]}`}>
                                        {r.status}
                                    </span>
                                    <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">
                                        {r.reason}
                                    </span>
                                    <span className="text-[11px] text-ink-500">{r.created_at}</span>
                                </div>
                                <p className="text-xs text-ink-500">{STATUS_COPY[r.status]}</p>

                                {r.target && (
                                    <div className="mt-3 rounded-lg border border-ink-900/5 bg-bone-50 p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">
                                            {TARGET_LABEL[r.target.type]}
                                        </p>
                                        {r.target.url ? (
                                            <Link href={r.target.url} className="mt-0.5 block text-sm font-semibold text-neon-red hover:underline">
                                                {r.target.title}
                                            </Link>
                                        ) : (
                                            <p className="mt-0.5 text-sm text-ink-700">{r.target.title}</p>
                                        )}
                                    </div>
                                )}

                                {r.reported_name && !r.target && (
                                    <p className="mt-2 text-xs text-ink-500">Against: <strong>{r.reported_name}</strong></p>
                                )}

                                {r.details && (
                                    <p className="mt-2 rounded-lg bg-bone-50 p-2 text-xs italic text-ink-700">"{r.details}"</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
