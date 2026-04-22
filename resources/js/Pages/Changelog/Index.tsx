import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

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
    is_new?: boolean;
}

const TAG_STYLE: Record<Entry['tag'], { pill: string; dot: string; label: string }> = {
    feature: { pill: 'bg-neon-red/15 text-neon-red ring-neon-red/30', dot: 'bg-neon-red', label: '✨ Feature' },
    improvement: { pill: 'bg-gaming-cyan/15 text-gaming-cyan ring-gaming-cyan/30', dot: 'bg-gaming-cyan', label: '⚡ Improved' },
    fix: { pill: 'bg-gaming-green/15 text-gaming-green ring-gaming-green/30', dot: 'bg-gaming-green', label: '🛠 Fix' },
    security: { pill: 'bg-gaming-orange/15 text-gaming-orange ring-gaming-orange/30', dot: 'bg-gaming-orange', label: '🛡 Security' },
};

export default function ChangelogIndex({
    entries,
    latestVersion,
    seo,
}: {
    entries: Entry[];
    latestVersion: string | null;
    seo?: { title?: string; description?: string };
}) {
    const { auth } = usePage().props as any;
    const isAuthed = !!auth?.user;
    const highlight = entries.find((e) => e.is_highlight);
    const rest = highlight ? entries.filter((e) => e.id !== highlight.id) : entries;

    // Group remaining entries by month for a magazine-like layout.
    const groups = groupByMonth(rest);

    const body = (
        <>
            <Head title={seo?.title ?? 'Changelog'}>
                {seo?.description && <meta name="description" content={seo.description} />}
            </Head>

            {/* ── Hero ──────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-ink-900/10 bg-gradient-to-b from-bone-50 to-bone-100 py-14 sm:py-20">
                <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-neon-red/20 blur-3xl" />
                <div aria-hidden className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-gaming-cyan/15 blur-3xl" />

                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
                    {latestVersion && (
                        <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-red/30 bg-neon-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-neon-red">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-red" />
                            Latest release · v{latestVersion.replace(/^v/, '')}
                        </span>
                    )}
                    <h1 className="text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
                        What's <span className="text-neon-red">new</span>
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 sm:text-base">
                        Every release, drop, and fix shipped to SquadSpawn — in chronological order. Bookmark this page or subscribe via RSS (soon™).
                    </p>
                </div>
            </section>

            {/* ── Content ───────────────────────────────────── */}
            <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
                {entries.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {highlight && <HighlightCard entry={highlight} />}

                        {/* Timeline */}
                        <ol className="relative mt-12 space-y-10 border-l border-ink-900/10 pl-6 sm:pl-10">
                            {groups.map(([month, monthEntries]) => (
                                <li key={month} className="space-y-6">
                                    <h2 className="-ml-6 mb-3 inline-block rounded-full border border-ink-900/10 bg-bone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-ink-500 sm:-ml-10">
                                        {month}
                                    </h2>
                                    {monthEntries.map((entry) => (
                                        <EntryCard key={entry.id} entry={entry} />
                                    ))}
                                </li>
                            ))}
                        </ol>
                    </>
                )}
            </section>
        </>
    );

    if (isAuthed) {
        return <AuthenticatedLayout>{body}</AuthenticatedLayout>;
    }

    // Guest view matches the Legal / Help pages
    return (
        <div className="min-h-screen bg-bone-50 text-ink-900">
            <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                <div className="flex items-center gap-2 text-xs">
                    <Link href={route('login')} className="rounded-lg px-3 py-1.5 font-semibold text-ink-700 transition hover:text-neon-red">Sign in</Link>
                    <Link href={route('register')} className="rounded-lg bg-neon-red px-3 py-1.5 font-semibold text-white shadow-glow-red transition hover:bg-neon-red/90">Get started</Link>
                </div>
            </nav>
            {body}
        </div>
    );
}

// ── Pieces ─────────────────────────────────────────────────────

function HighlightCard({ entry }: { entry: Entry }) {
    const style = TAG_STYLE[entry.tag];
    return (
        <Link
            href={route('changelog.show', entry.slug)}
            className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#14121a] via-[#14121a] to-neon-red-deep p-8 text-white shadow-xl transition hover:-translate-y-0.5 sm:p-10"
        >
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-neon-red/30 blur-3xl" />
            <div className="relative">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 ring-1 ${style.pill}`}>{style.label}</span>
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-white/80">v{entry.version.replace(/^v/, '')}</span>
                    {entry.is_new && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neon-red px-2.5 py-0.5 text-white">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            New
                        </span>
                    )}
                    <span className="text-white/50">· {entry.published_at_human}</span>
                </div>
                <h2 className="mt-3 text-2xl font-bold sm:text-4xl text-white">{entry.title}</h2>
                {entry.body_html && (
                    <div className="prose prose-invert prose-sm mt-5 max-w-none text-white/80 sm:text-base" dangerouslySetInnerHTML={{ __html: entry.body_html }} />
                )}
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-neon-red transition group-hover:gap-2.5">
                    Read the full release
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                    </svg>
                </span>
            </div>
        </Link>
    );
}

function EntryCard({ entry }: { entry: Entry }) {
    const style = TAG_STYLE[entry.tag];
    return (
        <article className="relative">
            {/* Timeline dot */}
            <span className={`absolute -left-[26px] top-2 h-3 w-3 rounded-full ring-4 ring-bone-50 sm:-left-[46px] ${style.dot}`} aria-hidden />
            <Link
                href={route('changelog.show', entry.slug)}
                className="group block overflow-hidden rounded-2xl border border-ink-900/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-neon-red/30 hover:shadow-lg sm:p-6"
            >
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-widest">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 ring-1 ${style.pill}`}>{style.label}</span>
                    <span className="rounded-full border border-ink-900/10 bg-bone-100 px-2.5 py-0.5 text-ink-700">v{entry.version.replace(/^v/, '')}</span>
                    {entry.is_new && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neon-red px-2.5 py-0.5 text-white">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                            New
                        </span>
                    )}
                    <span className="text-ink-500 normal-case tracking-normal">· {entry.published_at_human}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-ink-900 transition group-hover:text-neon-red">{entry.title}</h3>
                {entry.body_html && (
                    <div
                        className="prose prose-sm mt-3 max-w-none text-ink-700"
                        // Server-side sanitised via HtmlSanitizer, same pipeline as community posts.
                        dangerouslySetInnerHTML={{ __html: truncateHtml(entry.body_html, 280) }}
                    />
                )}
            </Link>
        </article>
    );
}

function EmptyState() {
    return (
        <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neon-red/10 text-neon-red">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-ink-900">No releases yet</h3>
            <p className="mt-1 text-sm text-ink-500">We'll drop the first changelog entry with the next deploy.</p>
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────

function groupByMonth(entries: Entry[]): [string, Entry[]][] {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
        if (!e.published_at) continue;
        const d = new Date(e.published_at);
        const key = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(e);
    }
    return Array.from(map.entries());
}

/** Crude HTML-aware truncate — strips tags, cuts, then returns plain. */
function truncateHtml(html: string, max: number): string {
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length <= max) return `<p>${escapeHtml(text)}</p>`;
    return `<p>${escapeHtml(text.slice(0, max).trimEnd())}…</p>`;
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// Re-export so other imports can reuse
export {};

// Wrapper needed so ReactNode isn't unused when nothing branches
void (null as ReactNode);
