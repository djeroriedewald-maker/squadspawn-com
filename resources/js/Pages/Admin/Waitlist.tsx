import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';

interface Entry {
    id: number;
    email: string;
    note: string | null;
    created_at: string | null;
    created_at_human: string | null;
    user: { id: number; name: string } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    entries: {
        data: Entry[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: { filter: string };
    counts: { all: number; with_note: number; registered: number };
}

const TABS: { value: string; label: string; countKey: keyof Props['counts'] }[] = [
    { value: 'all', label: 'All', countKey: 'all' },
    { value: 'with-note', label: 'With note', countKey: 'with_note' },
    { value: 'registered', label: 'Registered users', countKey: 'registered' },
];

export default function AdminWaitlist({ entries, filters, counts }: Props) {
    function remove(entry: Entry) {
        if (!confirm(`Remove "${entry.email}" from the waitlist? This cannot be undone.`)) return;
        router.delete(route('admin.waitlist.destroy', { entry: entry.id }), {
            preserveScroll: true,
        });
    }

    function copyAllEmails() {
        const emails = entries.data.map((e) => e.email).join(', ');
        navigator.clipboard?.writeText(emails).then(
            () => alert(`${entries.data.length} email(s) copied to clipboard.`),
            () => alert('Copy failed — your browser blocked clipboard access.'),
        );
    }

    return (
        <AdminLayout>
            <Head title="Admin — Plus waitlist" />

            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Plus waitlist</h1>
                    <p className="mt-1 text-sm text-ink-500">
                        Everyone who joined via <Link href={route('plus')} className="text-neon-red hover:underline">/plus</Link>. Read their notes to figure out what features people actually want.
                    </p>
                </div>
                {entries.data.length > 0 && (
                    <button
                        type="button"
                        onClick={copyAllEmails}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gaming-cyan/10 px-4 py-2 text-sm font-semibold text-gaming-cyan transition hover:bg-gaming-cyan/20"
                    >
                        Copy {entries.data.length} email{entries.data.length === 1 ? '' : 's'}
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-ink-900/10 bg-white dark:bg-bone-100 p-1 w-fit">
                {TABS.map((tab) => (
                    <Link
                        key={tab.value}
                        href={route('admin.waitlist.index', tab.value === 'all' ? {} : { filter: tab.value })}
                        preserveState
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                            filters.filter === tab.value
                                ? 'bg-neon-red text-white shadow-sm'
                                : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                        {tab.label} <span className="ml-1 opacity-70">({counts[tab.countKey]})</span>
                    </Link>
                ))}
            </div>

            {entries.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-900/10 bg-bone-100/50 p-12 text-center text-sm text-ink-500">
                    No waitlist entries yet. Share <Link href={route('plus')} className="text-neon-red hover:underline">/plus</Link> on Reddit / socials to start collecting demand signal.
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-ink-900/5 text-xs text-gray-500">
                                    <th className="px-5 py-3 font-medium">Email</th>
                                    <th className="px-5 py-3 font-medium">Note</th>
                                    <th className="px-5 py-3 font-medium">Account</th>
                                    <th className="px-5 py-3 font-medium">Joined</th>
                                    <th className="px-5 py-3 font-medium"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-900/5">
                                {entries.data.map((e) => (
                                    <tr key={e.id} className="text-ink-700">
                                        <td className="px-5 py-3 align-top">
                                            <a
                                                href={`mailto:${e.email}`}
                                                className="font-medium text-ink-900 hover:text-neon-red"
                                            >
                                                {e.email}
                                            </a>
                                        </td>
                                        <td className="max-w-md px-5 py-3 align-top">
                                            {e.note ? (
                                                <p className="whitespace-pre-wrap break-words text-sm text-ink-700">{e.note}</p>
                                            ) : (
                                                <span className="text-xs text-gray-500">—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 align-top">
                                            {e.user ? (
                                                <Link
                                                    href={route('admin.users.show', { user: e.user.id })}
                                                    className="rounded bg-gaming-cyan/10 px-2 py-0.5 text-[11px] font-medium text-gaming-cyan hover:bg-gaming-cyan/20"
                                                >
                                                    {e.user.name}
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-500">Not signed up</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 align-top text-xs text-gray-500" title={e.created_at ?? ''}>
                                            {e.created_at_human}
                                        </td>
                                        <td className="px-5 py-3 align-top">
                                            <button
                                                type="button"
                                                onClick={() => remove(e)}
                                                className="rounded-lg bg-red-500/10 px-3 py-1 text-[11px] font-medium text-red-500 transition hover:bg-red-500/20"
                                            >
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {entries.last_page > 1 && (
                        <div className="flex items-center justify-center gap-1 border-t border-ink-900/5 px-5 py-3">
                            {entries.links.map((link, i) => (
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
            )}
        </AdminLayout>
    );
}
