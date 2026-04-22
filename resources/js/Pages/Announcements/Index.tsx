import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface View {
    id: number;
    broadcast_id: number;
    title: string;
    body_html?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    image_url?: string | null;
    youtube_id?: string | null;
    sent_at?: string | null;
    sent_at_human?: string | null;
    viewed_at?: string | null;
}

export default function AnnouncementsIndex({ views }: { views: View[] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Announcements" />

            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">Announcements</h1>
                    <p className="mt-1 text-sm text-ink-500">Everything the team has posted to you, latest first.</p>
                </header>

                {views.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-12 text-center">
                        <p className="text-sm text-ink-500">No announcements yet. Check back soon.</p>
                    </div>
                ) : (
                    <ol className="space-y-4">
                        {views.map((v) => (
                            <li key={v.id} className="overflow-hidden rounded-2xl border border-ink-900/10 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
                                {v.image_url && !v.youtube_id && (
                                    <img src={v.image_url} alt="" className="h-40 w-full object-cover" />
                                )}
                                {v.youtube_id && (
                                    <div className="relative aspect-video w-full bg-black">
                                        <iframe
                                            className="absolute inset-0 h-full w-full"
                                            src={`https://www.youtube.com/embed/${v.youtube_id}`}
                                            title={v.title}
                                            frameBorder={0}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    </div>
                                )}

                                <div className="p-5 sm:p-6">
                                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-ink-500">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-neon-red/10 px-2.5 py-0.5 text-neon-red">
                                            <span className="h-1.5 w-1.5 rounded-full bg-neon-red" />
                                            Announcement
                                        </span>
                                        <span className="normal-case tracking-normal text-ink-500">· {v.sent_at_human}</span>
                                    </div>
                                    <h3 className="mt-2 text-xl font-bold text-ink-900">{v.title}</h3>
                                    {v.body_html && (
                                        <div className="prose prose-sm mt-2 max-w-none text-ink-700" dangerouslySetInnerHTML={{ __html: v.body_html }} />
                                    )}
                                    {v.cta_url && v.cta_label && (
                                        <a
                                            href={v.cta_url}
                                            target={v.cta_url.startsWith('http') ? '_blank' : undefined}
                                            rel={v.cta_url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-4 py-2 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                                        >
                                            {v.cta_label}
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}

                <p className="mt-8 text-center text-xs text-ink-500">
                    Want fewer (or more) of these? Head to{' '}
                    <Link href={route('notifPrefs.show')} className="text-neon-red hover:underline">
                        Notification preferences
                    </Link>
                    .
                </p>
            </div>
        </AuthenticatedLayout>
    );
}
