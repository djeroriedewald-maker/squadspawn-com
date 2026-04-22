import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

interface Entry {
    id: number;
    version: string;
    slug: string;
    title: string;
    tag: 'feature' | 'improvement' | 'fix' | 'security';
    tag_label: string;
    is_highlight: boolean;
    published_at: string | null;
    is_published: boolean;
    is_scheduled: boolean;
    author_name?: string | null;
}

interface Paginator<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

const TAG_COLOR: Record<Entry['tag'], string> = {
    feature: 'bg-neon-red/15 text-neon-red',
    improvement: 'bg-gaming-cyan/15 text-gaming-cyan',
    fix: 'bg-gaming-green/15 text-gaming-green',
    security: 'bg-gaming-orange/15 text-gaming-orange',
};

export default function AdminChangelogIndex({ entries }: { entries: Paginator<Entry>; suggestedVersion: string }) {
    const { flash } = usePage().props as any;

    const destroy = (entry: Entry) => {
        if (!confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
        router.delete(route('admin.changelog.destroy', entry.id), { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Changelog · Admin" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-ink-900">Changelog</h1>
                    <p className="mt-1 text-sm text-ink-500">Publish release notes. Users see them at <code className="rounded bg-bone-100 px-1 py-0.5 text-xs">/changelog</code>.</p>
                </div>
                <Link
                    href={route('admin.changelog.create')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-4 py-2.5 text-sm font-semibold text-white shadow-glow-red transition hover:bg-neon-red/90"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    New release
                </Link>
            </div>

            {flash?.message && (
                <div className="mb-6 rounded-lg border border-gaming-green/40 bg-gaming-green/10 px-4 py-2.5 text-sm font-semibold text-gaming-green">
                    {flash.message}
                </div>
            )}

            {entries.data.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-14 text-center">
                    <p className="text-sm text-ink-500">No releases yet. Hit <em>New release</em> to publish your first changelog entry.</p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-white">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-ink-900/10 bg-bone-100 text-[11px] uppercase tracking-widest text-ink-500">
                            <tr>
                                <th className="px-4 py-3">Version</th>
                                <th className="px-4 py-3">Title</th>
                                <th className="px-4 py-3">Tag</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Published</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.data.map((e) => (
                                <tr key={e.id} className="border-b border-ink-900/5 last:border-b-0 hover:bg-bone-100/60">
                                    <td className="px-4 py-3 font-mono text-xs text-ink-700">v{e.version.replace(/^v/, '')}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-ink-900">{e.title}</span>
                                            {e.is_highlight && <span className="rounded-full bg-neon-red/15 px-2 py-0.5 text-[10px] font-bold uppercase text-neon-red">Highlight</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${TAG_COLOR[e.tag]}`}>
                                            {e.tag_label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {e.is_published ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gaming-green">
                                                <span className="h-1.5 w-1.5 rounded-full bg-gaming-green" />
                                                Published
                                            </span>
                                        ) : e.is_scheduled ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gaming-orange">
                                                <span className="h-1.5 w-1.5 rounded-full bg-gaming-orange" />
                                                Scheduled
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500">
                                                <span className="h-1.5 w-1.5 rounded-full bg-ink-500" />
                                                Draft
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-ink-500">{e.published_at ?? '—'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="inline-flex items-center gap-1">
                                            {e.is_published && (
                                                <Link href={route('changelog.show', e.slug)} target="_blank" className="rounded-lg px-2 py-1 text-xs font-semibold text-ink-500 hover:text-ink-900">
                                                    View
                                                </Link>
                                            )}
                                            <Link
                                                href={route('admin.changelog.edit', e.id)}
                                                className="rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => destroy(e)}
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

            {/* Pagination */}
            {entries.last_page > 1 && (
                <div className="mt-6 flex justify-center gap-1">
                    {entries.links.map((l, i) => (
                        <Link
                            key={i}
                            href={l.url ?? '#'}
                            preserveScroll
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                l.active ? 'bg-neon-red text-white' : l.url ? 'border border-ink-900/10 bg-white text-ink-700 hover:text-neon-red' : 'text-ink-500 opacity-50'
                            }`}
                            dangerouslySetInnerHTML={{ __html: l.label }}
                        />
                    ))}
                </div>
            )}
        </AdminLayout>
    );
}
