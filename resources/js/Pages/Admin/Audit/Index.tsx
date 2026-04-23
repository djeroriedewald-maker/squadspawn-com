import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

interface ActionRow {
    id: number;
    action: string;
    metadata: Record<string, unknown> | null;
    created_at: string | null;
    created_at_human: string | null;
    actor: { id: number; name: string; is_owner: boolean } | null;
    target: { id: number; name: string; is_banned: boolean } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    actions: {
        data: ActionRow[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        action?: string;
        actor?: string;
        target?: string;
    };
    actionTypes: string[];
}

const ACTION_TONE: Record<string, string> = {
    'user.banned': 'bg-red-500/15 text-red-400',
    'user.unbanned': 'bg-gaming-green/15 text-gaming-green',
    'user.killed': 'bg-neon-red/20 text-neon-red',
    'user.role.admin_granted': 'bg-neon-red/15 text-neon-red',
    'user.role.admin_revoked': 'bg-ink-900/10 text-ink-700',
    'user.role.moderator_granted': 'bg-gaming-cyan/15 text-gaming-cyan',
    'user.role.moderator_revoked': 'bg-ink-900/10 text-ink-700',
    'impersonation.started': 'bg-gaming-cyan/15 text-gaming-cyan',
    'impersonation.stopped': 'bg-ink-900/10 text-ink-700',
};

function actionTone(action: string): string {
    return ACTION_TONE[action] || 'bg-ink-900/10 text-ink-700';
}

export default function AuditIndex({ actions, filters, actionTypes }: Props) {
    const [action, setAction] = useState(filters.action || '');
    const [actor, setActor] = useState(filters.actor || '');
    const [target, setTarget] = useState(filters.target || '');

    function applyFilters(e: FormEvent) {
        e.preventDefault();
        router.get(route('admin.audit'), {
            action: action || undefined,
            actor: actor || undefined,
            target: target || undefined,
        }, { preserveState: true });
    }

    function clearFilters() {
        setAction('');
        setActor('');
        setTarget('');
        router.get(route('admin.audit'));
    }

    const hasFilters = Boolean(filters.action || filters.actor || filters.target);

    return (
        <AdminLayout>
            <Head title="Admin - Audit log" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-ink-900">Audit log</h1>
                <p className="mt-1 text-sm text-ink-500">
                    Immutable trail of admin actions that affected a user account. Attribution by account id only — no IPs recorded.
                </p>
            </div>

            <form onSubmit={applyFilters} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100 p-4">
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Action</label>
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="rounded-lg border border-ink-900/10 bg-white dark:bg-bone-100 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/50 focus:outline-none"
                    >
                        <option value="">All actions</option>
                        {actionTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Actor ID</label>
                    <input
                        type="number"
                        value={actor}
                        onChange={(e) => setActor(e.target.value)}
                        placeholder="e.g. 1"
                        className="w-28 rounded-lg border border-ink-900/10 bg-white dark:bg-bone-100 px-3 py-2 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red/50 focus:outline-none"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Target ID</label>
                    <input
                        type="number"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-28 rounded-lg border border-ink-900/10 bg-white dark:bg-bone-100 px-3 py-2 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red/50 focus:outline-none"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-lg bg-neon-red px-5 py-2 text-sm font-medium text-white transition hover:bg-neon-red/80"
                >
                    Filter
                </button>
                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="rounded-lg bg-ink-900/5 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-900/10"
                    >
                        Clear
                    </button>
                )}
                <span className="ml-auto text-xs text-gray-500">{actions.total} total</span>
            </form>

            <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-ink-900/5 text-xs text-gray-500">
                                <th className="px-5 py-3 font-medium">When</th>
                                <th className="px-5 py-3 font-medium">Actor</th>
                                <th className="px-5 py-3 font-medium">Action</th>
                                <th className="px-5 py-3 font-medium">Target</th>
                                <th className="px-5 py-3 font-medium">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-900/5">
                            {actions.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-12 text-center text-ink-500">
                                        {hasFilters ? 'No actions match these filters.' : 'No admin actions recorded yet.'}
                                    </td>
                                </tr>
                            )}
                            {actions.data.map((row) => (
                                <tr key={row.id} className="text-ink-700">
                                    <td className="px-5 py-3 align-top text-xs text-gray-500" title={row.created_at || ''}>
                                        {row.created_at_human}
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                        {row.actor ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-ink-900">{row.actor.name}</span>
                                                {row.actor.is_owner && (
                                                    <span className="rounded-full bg-gaming-orange/20 px-1.5 py-0.5 text-[9px] font-bold text-gaming-orange">OWNER</span>
                                                )}
                                                <span className="text-[10px] text-gray-500">#{row.actor.id}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                        <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${actionTone(row.action)}`}>
                                            {row.action}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 align-top">
                                        {row.target ? (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-ink-900">{row.target.name}</span>
                                                {row.target.is_banned && (
                                                    <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400">BANNED</span>
                                                )}
                                                <span className="text-[10px] text-gray-500">#{row.target.id}</span>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 align-top text-xs text-ink-500">
                                        {row.metadata ? (
                                            <pre className="max-w-md whitespace-pre-wrap break-words font-mono text-[10px] text-ink-500">
                                                {JSON.stringify(row.metadata, null, 2)}
                                            </pre>
                                        ) : (
                                            <span className="text-gray-500">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {actions.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1 border-t border-ink-900/5 px-5 py-3">
                        {actions.links.map((link, i) => (
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
