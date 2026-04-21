import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';

interface Report {
    id: number;
    reporter: {
        name: string;
        profile?: { username: string; avatar?: string };
    };
    reported: {
        name: string;
        profile?: { username: string; avatar?: string };
    };
    lfg_post_id?: number | null;
    lfg_post?: {
        id: number;
        slug: string;
        title: string;
        status: string;
        description?: string | null;
        game?: { name: string } | null;
    } | null;
    reason: string;
    details: string;
    status: string;
    created_at: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    reports: {
        data: Report[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
    };
    filters: {
        status?: string;
    };
}

const statusTabs = [
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' },
];

export default function Reports({ reports, filters }: Props) {
    const currentStatus = filters.status || 'pending';

    function handleStatusChange(reportId: number, newStatus: string) {
        axios.post(route('admin.resolveReport', { report: reportId }), { status: newStatus }).then(() => {
            router.reload();
        });
    }

    function handleDeleteLfgPost(lfgPostId: number, title: string) {
        if (!window.confirm(`Delete LFG post "${title}"? This cannot be undone and removes all responses + messages.`)) return;
        axios.delete(route('admin.deleteLfgPost', { lfgPost: lfgPostId })).then(() => {
            router.reload();
        });
    }

    return (
        <AdminLayout>
            <Head title="Admin - Reports" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-ink-900">Reports</h1>
                <p className="mt-1 text-sm text-ink-500">Review and manage user reports</p>
            </div>

            {/* Filter Tabs */}
            <div className="mb-6 flex gap-1 rounded-lg bg-white p-1 w-fit border border-ink-900/10">
                {statusTabs.map((tab) => (
                    <Link
                        key={tab.value}
                        href={route('admin.reports', { status: tab.value })}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                            currentStatus === tab.value
                                ? 'bg-neon-red text-white shadow-sm'
                                : 'text-ink-500 hover:text-ink-900'
                        }`}
                        preserveState
                    >
                        {tab.label}
                    </Link>
                ))}
            </div>

            {/* Reports Table */}
            <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-white">
                {reports.data.length === 0 ? (
                    <div className="py-16 text-center text-sm text-gray-500">
                        No {currentStatus} reports
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-ink-900/5 text-xs text-gray-500">
                                    <th className="px-5 py-3 font-medium">Reporter</th>
                                    <th className="px-5 py-3 font-medium">Reported</th>
                                    <th className="px-5 py-3 font-medium">Context</th>
                                    <th className="px-5 py-3 font-medium">Reason</th>
                                    <th className="px-5 py-3 font-medium">Details</th>
                                    <th className="px-5 py-3 font-medium">Date</th>
                                    <th className="px-5 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-900/5">
                                {reports.data.map((report) => (
                                    <tr key={report.id} className="text-ink-700 transition hover:bg-white/[0.02]">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20 text-[10px] font-bold text-neon-red">
                                                    {report.reporter?.profile?.avatar ? (
                                                        <img src={report.reporter.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        (report.reporter?.profile?.username || report.reporter?.name || '?').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <span className="text-ink-900">{report.reporter?.profile?.username || report.reporter?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-500/20 text-[10px] font-bold text-red-400">
                                                    {report.reported?.profile?.avatar ? (
                                                        <img src={report.reported.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        (report.reported?.profile?.username || report.reported?.name || '?').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <span className="text-ink-900">{report.reported?.profile?.username || report.reported?.name}</span>
                                            </div>
                                        </td>
                                        <td className="max-w-[240px] px-5 py-3">
                                            {report.lfg_post ? (
                                                <div className="space-y-0.5">
                                                    <Link
                                                        href={`/lfg/${report.lfg_post.slug}`}
                                                        target="_blank"
                                                        className="block truncate text-xs font-semibold text-neon-red hover:underline"
                                                        title={report.lfg_post.title}
                                                    >
                                                        🎮 {report.lfg_post.title}
                                                    </Link>
                                                    <div className="text-[10px] text-ink-500">
                                                        {report.lfg_post.game?.name ?? 'LFG'} · {report.lfg_post.status}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-500">Profile report</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                                                {report.reason}
                                            </span>
                                        </td>
                                        <td className="max-w-[200px] px-5 py-3 truncate text-ink-500">
                                            {report.details || '--'}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">
                                            {new Date(report.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                {report.status !== 'reviewed' && (
                                                    <button
                                                        onClick={() => handleStatusChange(report.id, 'reviewed')}
                                                        className="rounded-lg bg-gaming-cyan/10 px-3 py-1.5 text-xs font-medium text-gaming-cyan transition hover:bg-gaming-cyan/20"
                                                    >
                                                        Mark Reviewed
                                                    </button>
                                                )}
                                                {report.status !== 'resolved' && (
                                                    <button
                                                        onClick={() => handleStatusChange(report.id, 'resolved')}
                                                        className="rounded-lg bg-gaming-green/10 px-3 py-1.5 text-xs font-medium text-gaming-green transition hover:bg-gaming-green/20"
                                                    >
                                                        Mark Resolved
                                                    </button>
                                                )}
                                                {report.lfg_post && (
                                                    <button
                                                        onClick={() => handleDeleteLfgPost(report.lfg_post!.id, report.lfg_post!.title)}
                                                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/20"
                                                    >
                                                        Delete LFG post
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {reports.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1 border-t border-ink-900/5 px-5 py-4">
                        {reports.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                    link.active
                                        ? 'bg-neon-red text-white'
                                        : link.url
                                          ? 'text-ink-500 hover:bg-ink-900/5 hover:text-ink-900'
                                          : 'cursor-default text-gray-600'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveState
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
