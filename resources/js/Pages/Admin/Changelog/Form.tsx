import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, lazy, Suspense } from 'react';

const RichEditor = lazy(() => import('@/Components/RichEditor'));

interface Entry {
    id: number;
    version: string;
    slug: string;
    title: string;
    body?: string;
    tag: 'feature' | 'improvement' | 'fix' | 'security';
    is_highlight: boolean;
    published_at?: string | null;
}

const TAGS: { value: Entry['tag']; label: string; hint: string; color: string }[] = [
    { value: 'feature', label: '✨ Feature', hint: 'Something brand new', color: 'border-neon-red/40 bg-neon-red/10 text-neon-red' },
    { value: 'improvement', label: '⚡ Improvement', hint: 'Better than before', color: 'border-gaming-cyan/40 bg-gaming-cyan/10 text-gaming-cyan' },
    { value: 'fix', label: '🛠 Fix', hint: 'Bug squashed', color: 'border-gaming-green/40 bg-gaming-green/10 text-gaming-green' },
    { value: 'security', label: '🛡 Security', hint: 'Hardening & privacy', color: 'border-gaming-orange/40 bg-gaming-orange/10 text-gaming-orange' },
];

export default function AdminChangelogForm({
    entry,
    suggestedVersion,
}: {
    entry: Entry | null;
    suggestedVersion: string | null;
}) {
    const isEditing = !!entry;

    // Default published_at = now in local tz, formatted for datetime-local.
    const defaultPublishedAt = (() => {
        const d = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    })();

    const { data, setData, post, put, processing, errors } = useForm<{
        version: string;
        title: string;
        body: string;
        tag: Entry['tag'];
        is_highlight: boolean;
        published_at: string;
    }>({
        version: entry?.version ?? suggestedVersion ?? '',
        title: entry?.title ?? '',
        body: entry?.body ?? '',
        tag: entry?.tag ?? 'feature',
        is_highlight: entry?.is_highlight ?? false,
        published_at: entry?.published_at ?? defaultPublishedAt,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (isEditing) {
            put(route('admin.changelog.update', entry!.id));
        } else {
            post(route('admin.changelog.store'));
        }
    };

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Edit release' : 'New release'} />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <Link href={route('admin.changelog.index')} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-neon-red">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to changelog
                    </Link>
                    <h1 className="text-2xl font-bold text-ink-900">{isEditing ? 'Edit release' : 'New release'}</h1>
                </div>
            </div>

            <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
                {/* Left: content */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Title</label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Profile banners + redesigned help centre"
                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2.5 text-lg font-semibold text-ink-900 outline-none transition focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                        />
                        {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-ink-500">Body</label>
                        <p className="mb-3 text-xs text-ink-500">Supports rich text, images, and YouTube embeds — same editor as community posts.</p>
                        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg border border-ink-100 bg-bone-100" />}>
                            <RichEditor
                                value={data.body}
                                onChange={(html) => setData('body', html)}
                                placeholder="Tell users what's new. Short paragraphs, bullet points, screenshots — whatever makes the release feel tangible."
                                error={errors.body}
                            />
                        </Suspense>
                        {errors.body && <p className="mt-1.5 text-xs text-red-500">{errors.body}</p>}
                    </div>
                </div>

                {/* Right: meta */}
                <aside className="space-y-6">
                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
                        <h3 className="mb-4 text-sm font-bold text-ink-900">Release info</h3>

                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Version</label>
                        <input
                            type="text"
                            value={data.version}
                            onChange={(e) => setData('version', e.target.value)}
                            placeholder="1.4.2"
                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 font-mono text-sm text-ink-900 outline-none transition focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                        />
                        {errors.version && <p className="mt-1.5 text-xs text-red-500">{errors.version}</p>}
                        {!errors.version && suggestedVersion && !isEditing && (
                            <p className="mt-1.5 text-[10px] text-ink-500">Suggested: v{suggestedVersion.replace(/^v/, '')}</p>
                        )}

                        <label className="mb-1.5 mt-5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Tag</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TAGS.map((t) => (
                                <button
                                    type="button"
                                    key={t.value}
                                    onClick={() => setData('tag', t.value)}
                                    className={`rounded-lg border px-3 py-2 text-left text-xs font-semibold transition ${
                                        data.tag === t.value ? t.color : 'border-ink-900/10 bg-bone-100 text-ink-700 hover:border-neon-red/30'
                                    }`}
                                >
                                    <span>{t.label}</span>
                                    <span className="mt-0.5 block text-[10px] font-normal opacity-70">{t.hint}</span>
                                </button>
                            ))}
                        </div>

                        <label className="mb-1.5 mt-5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Publish at</label>
                        <input
                            type="datetime-local"
                            value={data.published_at}
                            onChange={(e) => setData('published_at', e.target.value)}
                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                        />
                        <p className="mt-1 text-[10px] text-ink-500">Leave blank to save as a draft. Set a future date to schedule.</p>

                        <label className="mt-5 flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                checked={data.is_highlight}
                                onChange={(e) => setData('is_highlight', e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-ink-900/20 text-neon-red focus:ring-neon-red/30"
                            />
                            <span className="text-xs">
                                <span className="block font-semibold text-ink-900">Highlight this release</span>
                                <span className="block text-ink-500">Shows as the big hero card at the top of /changelog. Use for major drops.</span>
                            </span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-neon-red px-4 py-3 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90 disabled:opacity-50"
                    >
                        {processing ? 'Saving…' : isEditing ? 'Save changes' : 'Publish release'}
                    </button>
                </aside>
            </form>
        </AdminLayout>
    );
}
