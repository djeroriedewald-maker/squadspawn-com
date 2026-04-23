import FavoriteHostButton from '@/Components/FavoriteHostButton';
import { ProfileBanner } from '@/Components/ProfileBanner';
import SocialLinks from '@/Components/SocialLinks';
import SteamStatsCard, { SteamStats } from '@/Components/SteamStatsCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Clip, PageProps, User } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

function getYouTubeThumbnail(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

const platformBadge = (platform: string) => {
    switch (platform) {
        case 'youtube':
            return <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-400">YouTube</span>;
        case 'twitch':
            return <span className="rounded-full bg-purple-600/20 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-400">Twitch</span>;
        case 'tiktok':
            return <span className="rounded-full bg-ink-900/10 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-800">TikTok</span>;
        default:
            return null;
    }
};

const REPORT_REASONS = [
    'Inappropriate content',
    'Harassment',
    'Spam',
    'Fake profile',
    'Other',
];

interface ReputationData {
    score: number;
    count: number;
    top_tag: string | null;
    tags: Record<string, number>;
}

const TAG_LABELS: Record<string, { label: string; color: string }> = {
    great_teammate: { label: 'Great Teammate', color: 'text-gaming-green' },
    good_comms: { label: 'Good Comms', color: 'text-gaming-cyan' },
    skilled: { label: 'Skilled', color: 'text-neon-red' },
    friendly: { label: 'Friendly', color: 'text-gaming-green' },
    toxic: { label: 'Toxic', color: 'text-red-400' },
    no_show: { label: 'No Show', color: 'text-yellow-400' },
};

const RATING_TAGS = [
    { value: 'great_teammate', label: 'Great Teammate' },
    { value: 'good_comms', label: 'Good Comms' },
    { value: 'skilled', label: 'Skilled' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'toxic', label: 'Toxic' },
    { value: 'no_show', label: 'No Show' },
];

export default function PlayerShow({ player, clips = [], reputationData, friendsCount = 0, isFriend = false, isFavorited = false, myRating, steamStats }: PageProps<{ player: User; clips: Clip[]; reputationData?: ReputationData; friendsCount?: number; isFriend?: boolean; isFavorited?: boolean; myRating?: { score: number; tag?: string } | null; steamStats?: SteamStats | null }>) {
    const { auth, features } = usePage<PageProps & { features?: Record<string, boolean> }>().props;
    const clipsEnabled = features?.clips !== false;
    const isLoggedIn = !!auth?.user;
    const isOwnProfile = auth?.user?.id === player.id;

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [ratingScore, setRatingScore] = useState(myRating?.score || 0);
    const [ratingHover, setRatingHover] = useState(0);
    const [ratingTags, setRatingTags] = useState<string[]>(myRating?.tag ? myRating.tag.split(',') : []);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingDone, setRatingDone] = useState(!!myRating);

    const handleRate = async () => {
        if (ratingScore === 0 || ratingSubmitting) return;
        setRatingSubmitting(true);
        try {
            await axios.post(route('player.rate'), { rated_id: player.id, score: ratingScore, tag: ratingTags.length > 0 ? ratingTags.join(',') : undefined });
            setRatingDone(true);
            setShowRating(false);
        } catch {
            alert('Failed to submit rating.');
        } finally {
            setRatingSubmitting(false);
        }
    };

    const handleBlock = async () => {
        if (!confirm(`Are you sure you want to block ${player.profile?.username || player.name}? They won't be able to see your profile or match with you.`)) {
            return;
        }
        setBlockLoading(true);
        try {
            await axios.post('/block', { blocked_id: player.id });
            alert('User blocked.');
            router.visit('/discover');
        } catch {
            alert('Failed to block user. Please try again.');
            setBlockLoading(false);
        }
    };

    const handleReport = async () => {
        if (!reportReason) return;
        setReportSubmitting(true);
        try {
            await axios.post('/report', {
                reported_id: player.id,
                reason: reportReason,
                details: reportDetails || undefined,
            });
            setReportSuccess(true);
            setTimeout(() => {
                setShowReportModal(false);
                setReportSuccess(false);
                setReportReason('');
                setReportDetails('');
            }, 2000);
        } catch {
            alert('Failed to submit report. Please try again.');
        } finally {
            setReportSubmitting(false);
        }
    };

    const lookingForLabels: Record<string, string> = {
        casual: 'Casual', ranked: 'Ranked', friends: 'Friends', any: 'Open to Anything',
    };

    const mainGame = player.games && player.games.length > 0 ? player.games[0] : null;
    const username = player.profile?.username || player.name;

    const pageContent = (
        <>
            <Head title={`${username} - Player Profile`} />

            <div className="pb-12">
                {/* Cover Banner — preset or main-game cover, picked via
                    Profile Setup. Fades to the page background at the
                    bottom so the avatar overlaps naturally. */}
                <div className="relative">
                    <ProfileBanner
                        style={player.profile?.banner_style}
                        preset={player.profile?.banner_preset}
                        uploadPath={player.profile?.banner_upload_path}
                        mainGame={mainGame ?? null}
                        heightClass="h-48"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-bone-50 to-transparent" />
                </div>

                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Avatar + Header */}
                    <div className="relative -mt-16 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                        {/* Avatar with gradient border */}
                        <div className="gradient-border relative z-10 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-4xl font-bold text-ink-900">
                            {player.profile?.avatar ? (
                                <img src={player.profile.avatar} alt={username} className="h-full w-full object-cover" />
                            ) : (
                                (player.profile?.username?.[0] || player.name[0]).toUpperCase()
                            )}
                        </div>

                        <div className="mt-4 flex flex-1 flex-col items-center gap-3 sm:mt-0 sm:flex-row sm:items-end sm:justify-between">
                            <div className="text-center sm:text-left">
                                <h1 className={`text-3xl font-bold text-ink-900 ${player.profile?.is_creator ? 'text-neon-red' : ''}`}>
                                    {username}
                                </h1>
                                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    {player.profile?.level && player.profile.level > 1 && (
                                        <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                                            player.profile.level >= 6 ? 'bg-yellow-400/20 text-yellow-400' :
                                            player.profile.level >= 5 ? 'bg-gaming-pink/20 text-gaming-pink' :
                                            player.profile.level >= 4 ? 'bg-neon-red/20 text-neon-red' :
                                            player.profile.level >= 3 ? 'bg-gaming-cyan/20 text-gaming-cyan' :
                                            'bg-gaming-green/20 text-gaming-green'
                                        }`}>
                                            Lv.{player.profile.level} {
                                                player.profile.level >= 6 ? 'Legend' :
                                                player.profile.level >= 5 ? 'Champion' :
                                                player.profile.level >= 4 ? 'Elite' :
                                                player.profile.level >= 3 ? 'Veteran' : 'Player'
                                            }
                                        </span>
                                    )}
                                    {player.profile?.is_creator && (
                                        <span className="glow-border-cyan rounded-full bg-gaming-cyan/10 px-3 py-0.5 text-xs font-bold text-gaming-cyan">
                                            Creator
                                        </span>
                                    )}
                                    {player.profile?.is_featured_now && (
                                        <span className="rounded-full bg-gaming-orange/15 px-3 py-0.5 text-xs font-bold text-gaming-orange">
                                            ✨ Featured
                                        </span>
                                    )}
                                    {player.profile?.is_live && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-0.5 text-xs font-bold text-red-400">
                                            <span className="relative flex h-2 w-2">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                                            </span>
                                            Currently Live
                                        </span>
                                    )}
                                    {player.profile?.looking_for && (
                                        <span className="rounded-full bg-neon-red/20 px-3 py-0.5 text-xs font-medium text-neon-red">
                                            {lookingForLabels[player.profile.looking_for] || player.profile.looking_for}
                                        </span>
                                    )}
                                    {player.profile?.region && (
                                        <span className="rounded-full bg-ink-900/5 px-3 py-0.5 text-xs font-medium text-ink-500">
                                            {player.profile.region}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stream button */}
                            {player.profile?.stream_url && (
                                <a
                                    href={player.profile.stream_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg bg-gaming-green/10 px-4 py-2 text-sm font-bold text-gaming-green shadow-glow-green transition hover:bg-gaming-green/20"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                    Watch Stream
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Creator hero — only rendered for is_creator profiles. Promotes
                         clips + streaming context to the top of the page so visiting
                         viewers land on the things a creator actually wants you to
                         watch before scrolling through stats. Gated by the `clips`
                         feature flag so admins can disable the entire creator surface
                         in one toggle. */}
                    {clipsEnabled && player.profile?.is_creator && clips && clips.length > 0 && (
                        <div className="mt-6 overflow-hidden rounded-2xl border border-gaming-pink/20 bg-gradient-to-br from-gaming-pink/5 to-neon-red/5">
                            <div className="grid gap-0 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                                {/* Big top clip */}
                                <a
                                    href={clips[0].url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block aspect-video overflow-hidden bg-ink-900"
                                >
                                    {(() => {
                                        const thumb = clips[0].thumbnail || (clips[0].platform === 'youtube' ? getYouTubeThumbnail(clips[0].url) : null);
                                        return thumb ? (
                                            <img src={thumb} alt={clips[0].title} className="h-full w-full object-cover transition group-hover:scale-105" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-red/20 to-gaming-pink/20 text-5xl">🎬</div>
                                        );
                                    })()}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute left-3 top-3 flex items-center gap-2">
                                        {player.profile?.is_featured_now && (
                                            <span className="rounded-full bg-gaming-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">✨ Featured</span>
                                        )}
                                        {player.profile?.is_live && (
                                            <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                                                <span className="relative flex h-1.5 w-1.5">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                                                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
                                                </span>
                                                Live
                                            </span>
                                        )}
                                    </div>
                                    <div className="absolute inset-x-3 bottom-3">
                                        <p className="text-sm font-semibold text-white drop-shadow-lg line-clamp-2">{clips[0].title}</p>
                                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/80">
                                            {clips[0].platform === 'youtube' ? '▶ YouTube' : clips[0].platform === 'twitch' ? '🎮 Twitch' : clips[0].platform} · {clips.length} clip{clips.length === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neon-red/90 shadow-2xl">
                                            <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                    </div>
                                </a>

                                {/* Creator meta — socials + stream CTA */}
                                <div className="flex flex-col justify-between gap-4 p-4 sm:p-5">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gaming-pink">Content creator</p>
                                        <h2 className="mt-1 text-lg font-bold text-ink-900">Watch {username}</h2>
                                        {player.profile?.bio && (
                                            <p className="mt-2 line-clamp-3 text-xs text-ink-500">{player.profile.bio}</p>
                                        )}
                                    </div>

                                    {/* Socials as prominent chips */}
                                    {player.profile?.socials && (
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(player.profile.socials).filter(([, v]) => v && String(v).trim() !== '').slice(0, 6).map(([key, value]) => {
                                                const raw = String(value).trim();
                                                const stripped = raw.replace(/^@/, '');
                                                const href = raw.startsWith('http') ? raw : (
                                                    key === 'twitch' ? `https://twitch.tv/${stripped}` :
                                                    key === 'youtube' ? `https://youtube.com/${stripped}` :
                                                    key === 'tiktok' ? `https://tiktok.com/@${stripped}` :
                                                    key === 'twitter' ? `https://x.com/${stripped}` :
                                                    key === 'instagram' ? `https://instagram.com/${stripped}` :
                                                    raw
                                                );
                                                const label = key.charAt(0).toUpperCase() + key.slice(1);
                                                return (
                                                    <a
                                                        key={key}
                                                        href={href}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink-900 transition hover:bg-gaming-pink/10 hover:text-gaming-pink"
                                                    >
                                                        {label}
                                                    </a>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Row */}
                    <div className="mt-6 grid grid-cols-4 gap-3">
                        <div className="glow-border rounded-xl border border-ink-900/5 bg-white p-4 text-center">
                            <p className="text-2xl font-bold text-neon-red">{player.games?.length || 0}</p>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Games</p>
                        </div>
                        <div className="rounded-xl border border-ink-900/5 bg-white p-4 text-center">
                            <p className="text-2xl font-bold text-gaming-green">{friendsCount}</p>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Friends</p>
                        </div>
                        <div className="rounded-xl border border-ink-900/5 bg-white p-4 text-center">
                            <p className="text-2xl font-bold text-gaming-cyan">{clips.length}</p>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Clips</p>
                        </div>
                        <div className="rounded-xl border border-ink-900/5 bg-white p-4 text-center">
                            {reputationData && reputationData.count > 0 ? (
                                <>
                                    <p className="text-2xl font-bold text-yellow-400">{reputationData.score}<span className="ml-0.5 text-sm">&#9733;</span></p>
                                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">{reputationData.count} ratings</p>
                                </>
                            ) : (
                                <>
                                    <p className="text-2xl font-bold text-gray-600">--</p>
                                    <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Reputation</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Reputation Tags */}
                    {reputationData && reputationData.count > 0 && Object.keys(reputationData.tags).length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Known for:</span>
                            {Object.entries(reputationData.tags).slice(0, 4).map(([tag, count]) => (
                                <span key={tag} className={`rounded-full bg-white px-2.5 py-1 text-[11px] font-medium ${TAG_LABELS[tag]?.color || 'text-ink-500'}`}>
                                    {TAG_LABELS[tag]?.label || tag} ({count as number})
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Bio */}
                    {player.profile?.bio && (
                        <div className="card-gaming mt-6 rounded-2xl border border-ink-900/5 bg-white p-6">
                            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">About</h3>
                            <p className="text-sm leading-relaxed text-ink-700">{player.profile.bio}</p>
                        </div>
                    )}

                    {/* Socials */}
                    {player.profile?.socials && Object.values(player.profile.socials).some(v => v) && (
                        <div className="mt-4">
                            <SocialLinks socials={player.profile.socials} />
                        </div>
                    )}

                    {/* Favourite + Report + Block */}
                    {isLoggedIn && !isOwnProfile && (
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <FavoriteHostButton
                                hostId={player.id}
                                initialFavorited={isFavorited}
                            />
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                            >
                                Report
                            </button>
                            <button
                                onClick={handleBlock}
                                disabled={blockLoading}
                                className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                            >
                                {blockLoading ? 'Blocking...' : 'Block'}
                            </button>
                        </div>
                    )}

                    {/* Rate Friend */}
                    {isLoggedIn && !isOwnProfile && isFriend && (
                        <div className="mt-4">
                            {!showRating ? (
                                <button
                                    onClick={() => setShowRating(true)}
                                    className="flex items-center gap-2 rounded-lg border border-yellow-400/20 bg-yellow-400/5 px-4 py-2.5 text-sm font-medium text-yellow-400 transition hover:bg-yellow-400/10"
                                >
                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                                    {ratingDone ? 'Update Rating' : 'Rate This Player'}
                                </button>
                            ) : (
                                <div className="rounded-xl border border-yellow-400/20 bg-white p-5">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-ink-900">Rate {player.profile?.username || player.name}</h3>
                                        <button onClick={() => setShowRating(false)} className="text-gray-500 hover:text-ink-900">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    {/* Stars */}
                                    <div className="mb-3 flex gap-1">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button key={s} type="button" onClick={() => setRatingScore(s)} onMouseEnter={() => setRatingHover(s)} onMouseLeave={() => setRatingHover(0)} className="p-0.5">
                                                <svg className={`h-7 w-7 transition ${(ratingHover || ratingScore) >= s ? 'text-yellow-400' : 'text-gray-600'}`} fill={(ratingHover || ratingScore) >= s ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                                </svg>
                                            </button>
                                        ))}
                                    </div>
                                    {/* Tags - multiple selection */}
                                    <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-gray-500">Select all that apply</p>
                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                        {RATING_TAGS.map((t) => (
                                            <button key={t.value} type="button" onClick={() => setRatingTags((prev) => prev.includes(t.value) ? prev.filter((x) => x !== t.value) : [...prev, t.value])} className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${ratingTags.includes(t.value) ? (t.value === 'toxic' || t.value === 'no_show' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'bg-gaming-green/20 text-gaming-green ring-1 ring-gaming-green/40') : 'bg-ink-900/5 text-ink-500 hover:bg-ink-900/10'}`}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={handleRate} disabled={ratingScore === 0 || ratingSubmitting} className="w-full rounded-lg bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400/20 disabled:opacity-50">
                                        {ratingSubmitting ? 'Submitting...' : 'Submit Rating'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Report Modal */}
                    {showReportModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                            <div className="glow-border w-full max-w-md rounded-2xl border border-ink-900/10 bg-white p-6">
                                {reportSuccess ? (
                                    <div className="text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gaming-green/20 text-gaming-green">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="font-semibold text-ink-900">Report submitted</p>
                                        <p className="mt-1 text-sm text-ink-500">Thank you. We will review it shortly.</p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold text-ink-900">
                                            Report {username}
                                        </h3>
                                        <p className="mt-1 text-sm text-ink-500">
                                            Please select a reason for your report.
                                        </p>

                                        <div className="mt-4">
                                            <label className="mb-1.5 block text-sm font-medium text-ink-700">Reason</label>
                                            <select
                                                value={reportReason}
                                                onChange={(e) => setReportReason(e.target.value)}
                                                className="w-full rounded-lg border border-ink-900/10 bg-bone-200 px-3 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                            >
                                                <option value="">Select a reason...</option>
                                                {REPORT_REASONS.map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mt-4">
                                            <label className="mb-1.5 block text-sm font-medium text-ink-700">
                                                Details <span className="text-gray-500">(optional)</span>
                                            </label>
                                            <textarea
                                                value={reportDetails}
                                                onChange={(e) => setReportDetails(e.target.value)}
                                                rows={3}
                                                placeholder="Provide additional context..."
                                                className="w-full resize-none rounded-lg border border-ink-900/10 bg-bone-200 px-3 py-2 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                            />
                                        </div>

                                        <div className="mt-5 flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowReportModal(false);
                                                    setReportReason('');
                                                    setReportDetails('');
                                                }}
                                                className="rounded-lg px-4 py-2 text-sm font-medium text-ink-500 transition hover:text-ink-900"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleReport}
                                                disabled={!reportReason || reportSubmitting}
                                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                                            >
                                                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Games */}
                    {player.games && player.games.length > 0 && (
                        <div className="mt-8">
                            <h3 className="mb-4 text-lg font-bold text-ink-900">
                                Games ({player.games.length})
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {player.games.map((game) => (
                                    <div key={game.id} className="card-gaming group overflow-hidden rounded-xl border border-ink-900/5 bg-white transition">
                                        <div className="relative h-32 overflow-hidden">
                                            <img
                                                src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                alt={game.name}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-white via-bone-100/40 to-transparent" />
                                            <div className="absolute bottom-3 left-4 right-4">
                                                <p className="text-lg font-bold text-ink-900">{game.name}</p>
                                                <p className="text-xs text-ink-500">{game.genre}</p>
                                            </div>
                                            {game.pivot?.rank && (
                                                <div className="absolute right-3 top-3">
                                                    <span className="glow-border-green rounded-lg bg-bone-50/80 px-3 py-1 text-xs font-bold text-gaming-green backdrop-blur-sm">
                                                        {game.pivot.rank}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-3">
                                            {game.pivot?.role && (
                                                <span className="rounded-md bg-gaming-orange/10 px-2.5 py-0.5 text-xs font-semibold text-gaming-orange">
                                                    {game.pivot.role}
                                                </span>
                                            )}
                                            {game.pivot?.platform && (
                                                <span className="rounded-md bg-ink-900/5 px-2.5 py-0.5 text-xs capitalize text-ink-500">
                                                    {game.pivot.platform}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {steamStats && (
                        <div className="mt-8">
                            <SteamStatsCard stats={steamStats} isOwnProfile={isOwnProfile} />
                        </div>
                    )}

                    {/* Clips (gated by the same clips feature flag as the rest
                         of the creator surface) */}
                    {clipsEnabled && clips && clips.length > 0 && (
                        <div className="mt-8">
                            <h3 className="mb-4 text-lg font-bold text-ink-900">
                                Clips & Highlights ({clips.length})
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {clips.map((clip) => {
                                    const thumbnail = clip.thumbnail || (clip.platform === 'youtube' ? getYouTubeThumbnail(clip.url) : null);
                                    return (
                                        <a
                                            key={clip.id}
                                            href={clip.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="card-gaming group overflow-hidden rounded-xl border border-ink-900/5 bg-white transition"
                                        >
                                            <div className="relative aspect-video overflow-hidden">
                                                {thumbnail ? (
                                                    <img src={thumbnail} alt={clip.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-red/20 to-gaming-cyan/20">
                                                        <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neon-red/30 shadow-glow-red backdrop-blur">
                                                        <svg className="h-6 w-6 text-ink-900" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                </div>
                                                <div className="absolute right-2 top-2">
                                                    {platformBadge(clip.platform)}
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <p className="truncate text-sm font-semibold text-ink-900">{clip.title}</p>
                                                {clip.game && (
                                                    <p className="mt-0.5 text-xs text-gray-500">{clip.game.name}</p>
                                                )}
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* CTA for guests */}
                    {!isLoggedIn && (
                        <div className="mt-8 glow-border rounded-xl border border-neon-red/20 bg-neon-red/5 p-8 text-center">
                            <p className="text-lg font-bold text-ink-900">Want to team up with {username}?</p>
                            <p className="mt-1 text-sm text-ink-500">Create a free account to match and chat.</p>
                            <Link
                                href={route('register')}
                                className="mt-4 inline-block rounded-lg bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/80"
                            >
                                Sign Up Free
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    if (isLoggedIn) {
        return <AuthenticatedLayout>{pageContent}</AuthenticatedLayout>;
    }

    return (
        <div className="min-h-screen bg-bone-50 text-ink-900">
            <nav className="flex items-center justify-between border-b border-ink-900/5 bg-bone-50/80 px-6 py-4 backdrop-blur-xl lg:px-12">
                <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                <div className="flex items-center gap-4">
                    <Link href={route('login')} className="text-sm text-ink-700 hover:text-ink-900">Log in</Link>
                    <Link href={route('register')} className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white shadow-glow-red">Sign up</Link>
                </div>
            </nav>
            {pageContent}
        </div>
    );
}
