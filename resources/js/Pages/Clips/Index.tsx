import CreatorSpotlight, { FeaturedCreator } from '@/Components/CreatorSpotlight';
import PageHero from '@/Components/PageHero';
import SearchableSelect from '@/Components/SearchableSelect';
import SeoHead from '@/Components/SeoHead';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Clip, Game, PageProps } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useState } from 'react';

function getYouTubeThumbnail(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function detectPlatform(url: string): 'youtube' | 'twitch' | 'tiktok' | '' {
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/twitch\.tv/.test(url)) return 'twitch';
    if (/tiktok\.com/.test(url)) return 'tiktok';
    return '';
}

const platformBadge = (platform: string) => {
    switch (platform) {
        case 'youtube':
            return <span className="rounded-full bg-red-600/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-400">YouTube</span>;
        case 'twitch':
            return <span className="rounded-full bg-purple-600/20 px-2.5 py-0.5 text-[10px] font-bold uppercase text-purple-400">Twitch</span>;
        case 'tiktok':
            return <span className="rounded-full bg-ink-900/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-ink-800">TikTok</span>;
        default:
            return null;
    }
};

function ClipCard({ clip, onDelete }: { clip: Clip; onDelete?: (id: number) => void }) {
    const thumbnail = clip.thumbnail || (clip.platform === 'youtube' ? getYouTubeThumbnail(clip.url) : null);

    return (
        <div className="group overflow-hidden rounded-xl border border-ink-900/10 bg-white transition hover:border-neon-red/30">
            {/* Thumbnail / Preview */}
            <a href={clip.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-video overflow-hidden bg-bone-50">
                {thumbnail ? (
                    <img src={thumbnail} alt={clip.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-red/20 to-gaming-green/20">
                        <svg className="h-10 w-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                    </div>
                )}
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/20 backdrop-blur">
                        <svg className="h-6 w-6 text-ink-900" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                </div>
                {/* Platform badge */}
                <div className="absolute right-2 top-2">
                    {platformBadge(clip.platform)}
                </div>
            </a>

            {/* Info */}
            <div className="p-3">
                <h4 className="truncate text-sm font-semibold text-ink-900">{clip.title}</h4>
                <div className="mt-2 flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-neon-red to-neon-red-deep">
                        {clip.user?.profile?.avatar ? (
                            <img src={clip.user.profile.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-xs font-bold text-neon-red">
                                {(clip.user?.profile?.username?.[0] || clip.user?.name?.[0] || '?').toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <Link
                            href={route('player.show', { username: clip.user?.profile?.username || clip.user?.id })}
                            className="block truncate text-xs font-medium text-ink-900 hover:text-neon-red"
                        >
                            {clip.user?.profile?.username || clip.user?.name}
                        </Link>
                        {clip.game && (
                            <span className="text-[10px] text-gray-500">{clip.game.name}</span>
                        )}
                    </div>
                </div>
                {onDelete && (
                    <button
                        onClick={() => onDelete(clip.id)}
                        className="mt-2 text-xs text-red-400 transition hover:text-red-300"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}

export default function ClipsIndex({
    clips,
    games,
    filters,
    featuredCreators,
}: {
    clips: { data: Clip[]; links: any[]; current_page: number; last_page: number };
    games: Game[];
    filters: { game_id?: string };
    featuredCreators?: FeaturedCreator[];
}) {
    const { auth } = usePage<PageProps>().props;
    const isLoggedIn = !!auth?.user;

    const [showForm, setShowForm] = useState(false);
    const [formUrl, setFormUrl] = useState('');
    const [formTitle, setFormTitle] = useState('');
    const [formGameId, setFormGameId] = useState('');
    const [formPlatform, setFormPlatform] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const handleUrlChange = (url: string) => {
        setFormUrl(url);
        const detected = detectPlatform(url);
        if (detected) setFormPlatform(detected);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!formUrl || !formTitle || !formPlatform) {
            setFormError('Please fill in all required fields.');
            return;
        }
        setSubmitting(true);
        setFormError('');
        try {
            await axios.post(route('clips.store'), {
                url: formUrl,
                title: formTitle,
                game_id: formGameId || null,
                platform: formPlatform,
            });
            setFormUrl('');
            setFormTitle('');
            setFormGameId('');
            setFormPlatform('');
            setShowForm(false);
            router.reload({ only: ['clips'] });
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to share clip.';
            setFormError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this clip?')) return;
        try {
            await axios.delete(route('clips.destroy', { clip: id }));
            router.reload({ only: ['clips'] });
        } catch {
            alert('Failed to delete clip.');
        }
    };

    const handleGameFilter = (gameId: string) => {
        router.get(route('clips.index'), gameId ? { game_id: gameId } : {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const pageContent = (
        <>
            <SeoHead fallbackTitle="Creators · SquadSpawn" />

            <PageHero
                image="/images/gamer7.jpg"
                eyebrow="Creator Spotlight"
                title="Creators"
                subtitle="Discover streamers and content creators in the SquadSpawn community — and share your own best clips from YouTube, Twitch or TikTok to get found."
                size="md"
                badges={
                    <span className="rounded-full bg-gaming-pink/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ring-1 ring-gaming-pink/40">
                        ✨ Early access · Free
                    </span>
                }
                actions={
                    <>
                        <SearchableSelect
                            variant="on-image"
                            align="right"
                            value={filters.game_id || ''}
                            emptyLabel="All games"
                            searchPlaceholder="Search games…"
                            onChange={handleGameFilter}
                            options={games.map((g) => ({
                                value: String(g.id),
                                label: g.name,
                                image: g.cover_image || `/images/games/${g.slug}.svg`,
                            }))}
                        />
                        {isLoggedIn ? (
                            <button
                                onClick={() => setShowForm(!showForm)}
                                className="flex items-center gap-2 rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-neon-red/90"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                Share a Clip
                            </button>
                        ) : (
                            <Link
                                href={route('register')}
                                className="flex items-center gap-2 rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-neon-red/90"
                            >
                                Sign Up to Share
                            </Link>
                        )}
                    </>
                }
            />

            <div className="py-8">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

                    {/* Creator-discovery hints. Shown only to logged-in users who
                         haven't fully set themselves up yet — silent for admins who
                         have already positioned themselves. */}
                    {isLoggedIn && !auth.user?.profile?.is_creator && (
                        <div className="mb-6 rounded-xl border border-gaming-cyan/30 bg-gaming-cyan/5 p-4">
                            <p className="text-sm text-ink-700">
                                <strong className="text-gaming-cyan">Are you a streamer or content creator?</strong> Mark yourself as a creator in{' '}
                                <Link href={route('game-profile.edit')} className="font-semibold text-neon-red hover:underline">
                                    Profile settings
                                </Link>
                                {' '}and your clips become eligible for the Spotlight on the homepage + dashboard.
                            </p>
                        </div>
                    )}
                    {isLoggedIn && auth.user?.profile?.is_creator && (
                        <div className="mb-6 rounded-xl border border-gaming-orange/30 bg-gaming-orange/5 p-4">
                            <p className="text-sm text-ink-700">
                                <strong className="text-gaming-orange">✨ You're marked as a creator.</strong> Share individual clips below to be considered for the Creator Spotlight — your YouTube/Twitch channel link in your profile isn't a clip on its own.
                            </p>
                            <p className="mt-1.5 text-[11px] text-ink-500">
                                Spotlight featuring is <strong>free for founding creators</strong> while we grow the platform. Paid promoted slots will arrive once we have the audience to make them worthwhile.
                            </p>
                        </div>
                    )}

                    {/* Share Form */}
                    {showForm && isLoggedIn && (
                        <div className="mb-8 rounded-xl border border-neon-red/20 bg-white p-6">
                            <h3 className="mb-4 text-lg font-semibold text-ink-900">Share a Clip</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-ink-700">URL *</label>
                                        <input
                                            type="url"
                                            value={formUrl}
                                            onChange={(e) => handleUrlChange(e.target.value)}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-ink-700">Title *</label>
                                        <input
                                            type="text"
                                            value={formTitle}
                                            onChange={(e) => setFormTitle(e.target.value)}
                                            placeholder="Insane 1v5 clutch"
                                            maxLength={100}
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-ink-700">Game</label>
                                        <select
                                            value={formGameId}
                                            onChange={(e) => setFormGameId(e.target.value)}
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                        >
                                            <option value="">Select game (optional)</option>
                                            {games.map((game) => (
                                                <option key={game.id} value={game.id}>{game.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-ink-700">Platform *</label>
                                        <select
                                            value={formPlatform}
                                            onChange={(e) => setFormPlatform(e.target.value)}
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                            required
                                        >
                                            <option value="">Select platform</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="twitch">Twitch</option>
                                            <option value="tiktok">TikTok</option>
                                        </select>
                                    </div>
                                </div>

                                {/* YouTube preview */}
                                {formPlatform === 'youtube' && getYouTubeThumbnail(formUrl) && (
                                    <div className="flex items-center gap-3 rounded-lg border border-ink-900/5 bg-bone-50 p-3">
                                        <img src={getYouTubeThumbnail(formUrl)!} alt="Preview" className="h-16 w-28 rounded object-cover" />
                                        <span className="text-xs text-ink-500">Preview</span>
                                    </div>
                                )}

                                {formError && (
                                    <p className="text-sm text-red-400">{formError}</p>
                                )}

                                <div className="flex items-center gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="rounded-lg bg-neon-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/80 disabled:opacity-50"
                                    >
                                        {submitting ? 'Sharing...' : 'Share Clip'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="rounded-lg px-4 py-2 text-sm text-ink-500 transition hover:text-ink-900"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Guest CTA */}
                    {!isLoggedIn && (
                        <div className="mb-8 rounded-xl border border-neon-red/20 bg-neon-red/5 p-6 text-center">
                            <p className="font-semibold text-ink-900">Want to share your clips?</p>
                            <p className="mt-1 text-sm text-ink-500">Create a free account to start sharing your best gaming moments.</p>
                            <Link
                                href={route('register')}
                                className="mt-3 inline-block rounded-lg bg-neon-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neon-red/80"
                            >
                                Sign Up Free
                            </Link>
                        </div>
                    )}

                    {/* Creator Spotlight — hand-curated featured creators at the top,
                         so visitors land on the people doing the most with SquadSpawn before
                         scrolling into the full clip feed. */}
                    {featuredCreators && featuredCreators.length > 0 && (
                        <div className="mb-8">
                            <CreatorSpotlight
                                creators={featuredCreators}
                                heading="Featured creators"
                                subheading="Hand-picked streamers + content creators building their audience on SquadSpawn."
                            />
                        </div>
                    )}

                    {/* Clips Grid */}
                    {clips.data.length === 0 ? (
                        <div className="rounded-2xl border border-ink-900/10 bg-white p-12 text-center">
                            <svg className="mx-auto h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                            <p className="mt-4 text-lg font-medium text-ink-500">No clips yet</p>
                            <p className="mt-1 text-sm text-gray-500">Be the first to share a gaming highlight!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {clips.data.map((clip) => (
                                <ClipCard
                                    key={clip.id}
                                    clip={clip}
                                    onDelete={isLoggedIn && clip.user_id === auth.user.id ? handleDelete : undefined}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {clips.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {clips.links.map((link: any, i: number) => (
                                <button
                                    key={i}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                        link.active
                                            ? 'bg-neon-red font-semibold text-white'
                                            : link.url
                                              ? 'text-ink-500 hover:bg-white hover:text-ink-900'
                                              : 'cursor-not-allowed text-gray-600'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    if (isLoggedIn) {
        return (
            // No header prop — the PageHero inside pageContent doubles as the
            // page header, and duplicating the title above it creates the
            // "pale strip + hero" stack that looked like a white overlay.
            <AuthenticatedLayout>
                {pageContent}
            </AuthenticatedLayout>
        );
    }

    return (
        <div className="min-h-screen bg-bone-50 text-ink-900">
            <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                <div className="flex items-center gap-4">
                    <Link href={route('login')} className="text-sm text-ink-700 hover:text-ink-900">Log in</Link>
                    <Link href={route('register')} className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white">Sign up</Link>
                </div>
            </nav>
            {pageContent}
        </div>
    );
}
