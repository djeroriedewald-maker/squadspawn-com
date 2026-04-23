import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

interface Message {
    id: number;
    name: string;
    email: string;
    subject: string;
    body: string;
    status: 'new' | 'read' | 'replied' | 'archived';
    created_at: string;
    created_at_human: string;
    user: { id: number; name: string } | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    messages: {
        data: Message[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: { status: string };
    counts: { new: number; read: number; replied: number; archived: number };
}

const TABS: { value: string; label: string; countKey: keyof Props['counts'] | null }[] = [
    { value: 'new', label: 'New', countKey: 'new' },
    { value: 'read', label: 'Read', countKey: 'read' },
    { value: 'replied', label: 'Replied', countKey: 'replied' },
    { value: 'archived', label: 'Archived', countKey: 'archived' },
    { value: 'all', label: 'All', countKey: null },
];

const STATUS_TONE: Record<string, string> = {
    new: 'bg-neon-red/15 text-neon-red',
    read: 'bg-gaming-cyan/15 text-gaming-cyan',
    replied: 'bg-gaming-green/15 text-gaming-green',
    archived: 'bg-ink-900/10 text-ink-500',
};

export default function AdminMessages({ messages, filters, counts }: Props) {
    const [expanded, setExpanded] = useState<number | null>(null);

    function changeStatus(m: Message, status: Message['status']) {
        axios.post(route('admin.messages.updateStatus', { message: m.id }), { status })
            .then(() => router.reload({ only: ['messages', 'counts'] }))
            .catch(() => alert('Failed to update.'));
    }

    function remove(m: Message) {
        if (!confirm(`Permanently delete "${m.subject}"? This cannot be undone.`)) return;
        router.delete(route('admin.messages.destroy', { message: m.id }), {
            preserveScroll: true,
        });
    }

    function openAndMarkRead(m: Message) {
        setExpanded(expanded === m.id ? null : m.id);
        if (m.status === 'new') {
            changeStatus(m, 'read');
        }
    }

    return (
        <AdminLayout>
            <Head title="Admin — Messages" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink-900">Messages</h1>
                <p className="mt-1 text-sm text-ink-500">
                    Inbox for the public <Link href={route('contact')} className="text-neon-red hover:underline">/contact</Link> form. Click a row to read + automatically mark as read.
                </p>
            </div>

            {/* Filter tabs */}
            <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-ink-900/10 bg-white dark:bg-bone-100 p-1 w-fit">
                {TABS.map((tab) => (
                    <Link
                        key={tab.value}
                        href={route('admin.messages.index', tab.value === 'all' ? {} : { status: tab.value })}
                        preserveState
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                            filters.status === tab.value
                                ? 'bg-neon-red text-white shadow-sm'
                                : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                        {tab.label}
                        {tab.countKey !== null && (
                            <span className="ml-1 opacity-70">({counts[tab.countKey]})</span>
                        )}
                    </Link>
                ))}
            </div>

            {messages.data.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-900/10 bg-bone-100/50 p-12 text-center text-sm text-ink-500">
                    {filters.status === 'new' ? 'Inbox zero — no new messages right now.' : `No ${filters.status} messages.`}
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.data.map((m) => (
                        <article
                            key={m.id}
                            className={`overflow-hidden rounded-xl border bg-white transition dark:bg-bone-100 ${
                                m.status === 'new' ? 'border-neon-red/30 shadow-sm shadow-neon-red/5' : 'border-ink-900/10'
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => openAndMarkRead(m)}
                                className="w-full text-left"
                            >
                                <div className="flex flex-wrap items-start gap-3 p-4 sm:flex-nowrap sm:items-center">
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[m.status]}`}>
                                        {m.status}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-ink-900">{m.subject}</p>
                                            {m.user && (
                                                <Link
                                                    href={route('admin.users.show', { user: m.user.id })}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="rounded bg-gaming-cyan/10 px-1.5 py-0.5 text-[10px] font-medium text-gaming-cyan hover:bg-gaming-cyan/20"
                                                >
                                                    registered user
                                                </Link>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-ink-500">
                                            From <strong className="text-ink-700">{m.name}</strong> · {m.email} · {m.created_at_human}
                                        </p>
                                    </div>
                                    <svg className={`h-4 w-4 shrink-0 text-ink-500 transition ${expanded === m.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </button>

                            {expanded === m.id && (
                                <div className="border-t border-ink-900/5 bg-bone-50/50 p-4">
                                    <pre className="whitespace-pre-wrap break-words font-sans text-sm text-ink-700">
                                        {m.body}
                                    </pre>
                                    <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-900/5 pt-4">
                                        <a
                                            href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}&body=${encodeURIComponent('\n\n\n-- Original message --\n' + m.body)}`}
                                            onClick={() => changeStatus(m, 'replied')}
                                            className="rounded-lg bg-gaming-green/10 px-3 py-1.5 text-xs font-medium text-gaming-green transition hover:bg-gaming-green/20"
                                        >
                                            Reply via email
                                        </a>
                                        {m.status !== 'replied' && (
                                            <button
                                                type="button"
                                                onClick={() => changeStatus(m, 'replied')}
                                                className="rounded-lg bg-ink-900/5 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-900/10"
                                            >
                                                Mark as replied
                                            </button>
                                        )}
                                        {m.status !== 'archived' && (
                                            <button
                                                type="button"
                                                onClick={() => changeStatus(m, 'archived')}
                                                className="rounded-lg bg-ink-900/5 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-900/10"
                                            >
                                                Archive
                                            </button>
                                        )}
                                        {m.status === 'archived' && (
                                            <button
                                                type="button"
                                                onClick={() => changeStatus(m, 'read')}
                                                className="rounded-lg bg-ink-900/5 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-900/10"
                                            >
                                                Unarchive
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => remove(m)}
                                            className="ml-auto rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/20"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}

            {messages.last_page > 1 && (
                <div className="mt-6 flex items-center justify-center gap-1">
                    {messages.links.map((link, i) => (
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
        </AdminLayout>
    );
}
