import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';

interface Entry {
    id: number;
    version: string;
    slug: string;
    title: string;
    body_html?: string | null;
    tag: 'feature' | 'improvement' | 'fix' | 'security';
    tag_label: string;
    is_highlight: boolean;
    published_at?: string | null;
    published_at_human?: string | null;
    author_name?: string | null;
}

const TAG_STYLE: Record<Entry['tag'], { pill: string; label: string }> = {
    feature: { pill: 'bg-neon-red/15 text-neon-red ring-neon-red/30', label: '✨ Feature' },
    improvement: { pill: 'bg-gaming-cyan/15 text-gaming-cyan ring-gaming-cyan/30', label: '⚡ Improved' },
    fix: { pill: 'bg-gaming-green/15 text-gaming-green ring-gaming-green/30', label: '🛠 Fix' },
    security: { pill: 'bg-gaming-orange/15 text-gaming-orange ring-gaming-orange/30', label: '🛡 Security' },
};

export default function ChangelogShow({
    entry,
    seo,
}: {
    entry: Entry;
    seo?: { title?: string; description?: string };
}) {
    const { auth } = usePage().props as any;
    const isAuthed = !!auth?.user;
    const style = TAG_STYLE[entry.tag];

    const body = (
        <>
            <Head title={seo?.title ?? entry.title}>
                {seo?.description && <meta name="description" content={seo.description} />}
            </Head>

            <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
                <Link
                    href={route('changelog.index')}
                    className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition hover:text-neon-red"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    All releases
                </Link>

                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ring-1 ${style.pill}`}>{style.label}</span>
                    <span className="rounded-full border border-ink-900/10 bg-bone-100 px-2.5 py-0.5 text-ink-700">v{entry.version.replace(/^v/, '')}</span>
                    <span className="text-ink-500 normal-case tracking-normal">· {entry.published_at_human}</span>
                </div>

                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">{entry.title}</h1>

                {entry.body_html && (
                    <div
                        className="prose prose-lg mt-8 max-w-none text-ink-700 prose-headings:text-ink-900 prose-a:text-neon-red prose-strong:text-ink-900 prose-img:rounded-xl prose-img:border prose-img:border-ink-900/10"
                        dangerouslySetInnerHTML={{ __html: entry.body_html }}
                    />
                )}

                {/* Footer — share + meta */}
                <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-900/10 bg-white p-5">
                    <p className="text-xs text-ink-500">
                        Shipped{entry.author_name ? ` by ${entry.author_name}` : ''} · v{entry.version.replace(/^v/, '')}
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            navigator.clipboard?.writeText(window.location.href).catch(() => {});
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                    >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                        </svg>
                        Copy link
                    </button>
                </div>
            </article>
        </>
    );

    if (isAuthed) {
        return <AuthenticatedLayout>{body}</AuthenticatedLayout>;
    }

    return (
        <div className="min-h-screen bg-bone-50 text-ink-900">
            <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                <Link href={route('changelog.index')} className="text-xs font-semibold text-ink-700 transition hover:text-neon-red">Changelog</Link>
            </nav>
            {body}
        </div>
    );
}
