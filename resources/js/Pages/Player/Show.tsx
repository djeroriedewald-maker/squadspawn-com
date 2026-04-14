import SocialLinks from '@/Components/SocialLinks';
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
            return <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-200">TikTok</span>;
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
    skilled: { label: 'Skilled', color: 'text-gaming-purple' },
    friendly: { label: 'Friendly', color: 'text-gaming-green' },
    toxic: { label: 'Toxic', color: 'text-red-400' },
    no_show: { label: 'No Show', color: 'text-yellow-400' },
};

export default function PlayerShow({ player, clips = [], reputationData, friendsCount = 0 }: PageProps<{ player: User; clips: Clip[]; reputationData?: ReputationData; friendsCount?: number }>) {
    const { auth } = usePage<PageProps>().props;
    const isLoggedIn = !!auth?.user;
    const isOwnProfile = auth?.user?.id === player.id;

    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportDetails, setReportDetails] = useState('');
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportSuccess, setReportSuccess] = useState(false);
    const [blockLoading, setBlockLoading] = useState(false);

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
                {/* Cover Banner */}
                <div className="relative h-48 w-full overflow-hidden">
                    {mainGame?.cover_image ? (
                        <img
                            src={mainGame.cover_image}
                            alt=""
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-r from-gaming-purple/30 via-navy-800 to-gaming-cyan/30" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/60 to-transparent" />
                    <div className="absolute inset-0 bg-grid opacity-20" />
                </div>

                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Avatar + Header */}
                    <div className="relative -mt-16 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                        {/* Avatar with gradient border */}
                        <div className="gradient-border relative z-10 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-800 text-4xl font-bold text-white">
                            {player.profile?.avatar ? (
                                <img src={player.profile.avatar} alt={username} className="h-full w-full object-cover" />
                            ) : (
                                (player.profile?.username?.[0] || player.name[0]).toUpperCase()
                            )}
                        </div>

                        <div className="mt-4 flex flex-1 flex-col items-center gap-3 sm:mt-0 sm:flex-row sm:items-end sm:justify-between">
                            <div className="text-center sm:text-left">
                                <h1 className={`text-3xl font-bold text-white ${player.profile?.is_creator ? 'text-neon-purple' : ''}`}>
                                    {username}
                                </h1>
                                <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                    {player.profile?.is_creator && (
                                        <span className="glow-border-cyan rounded-full bg-gaming-cyan/10 px-3 py-0.5 text-xs font-bold text-gaming-cyan">
                                            Creator
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
                                        <span className="rounded-full bg-gaming-purple/20 px-3 py-0.5 text-xs font-medium text-gaming-purple">
                                            {lookingForLabels[player.profile.looking_for] || player.profile.looking_for}
                                        </span>
                                    )}
                                    {player.profile?.region && (
                                        <span className="rounded-full bg-white/5 px-3 py-0.5 text-xs font-medium text-gray-400">
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

                    {/* Stats Row */}
                    <div className="mt-6 grid grid-cols-4 gap-3">
                        <div className="glow-border rounded-xl border border-white/5 bg-navy-800 p-4 text-center">
                            <p className="text-2xl font-bold text-gaming-purple">{player.games?.length || 0}</p>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Games</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-navy-800 p-4 text-center">
                            <p className="text-2xl font-bold text-gaming-green">{friendsCount}</p>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Friends</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-navy-800 p-4 text-center">
                            <p className="text-2xl font-bold text-gaming-cyan">{clips.length}</p>
                            <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Clips</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-navy-800 p-4 text-center">
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
                                <span key={tag} className={`rounded-full bg-navy-800 px-2.5 py-1 text-[11px] font-medium ${TAG_LABELS[tag]?.color || 'text-gray-400'}`}>
                                    {TAG_LABELS[tag]?.label || tag} ({count as number})
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Bio */}
                    {player.profile?.bio && (
                        <div className="card-gaming mt-6 rounded-2xl border border-white/5 bg-navy-800 p-6">
                            <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">About</h3>
                            <p className="text-sm leading-relaxed text-gray-300">{player.profile.bio}</p>
                        </div>
                    )}

                    {/* Socials */}
                    {player.profile?.socials && Object.values(player.profile.socials).some(v => v) && (
                        <div className="mt-4">
                            <SocialLinks socials={player.profile.socials} />
                        </div>
                    )}

                    {/* Report & Block buttons */}
                    {isLoggedIn && !isOwnProfile && (
                        <div className="mt-6 flex items-center gap-3">
                            <button
                                onClick={() => setShowReportModal(true)}
                                className="rounded-lg border border-white/10 bg-navy-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                            >
                                Report
                            </button>
                            <button
                                onClick={handleBlock}
                                disabled={blockLoading}
                                className="rounded-lg border border-white/10 bg-navy-800 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                            >
                                {blockLoading ? 'Blocking...' : 'Block'}
                            </button>
                        </div>
                    )}

                    {/* Report Modal */}
                    {showReportModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                            <div className="glow-border w-full max-w-md rounded-2xl border border-white/10 bg-navy-800 p-6">
                                {reportSuccess ? (
                                    <div className="text-center">
                                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gaming-green/20 text-gaming-green">
                                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="font-semibold text-white">Report submitted</p>
                                        <p className="mt-1 text-sm text-gray-400">Thank you. We will review it shortly.</p>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="text-lg font-bold text-white">
                                            Report {username}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Please select a reason for your report.
                                        </p>

                                        <div className="mt-4">
                                            <label className="mb-1.5 block text-sm font-medium text-gray-300">Reason</label>
                                            <select
                                                value={reportReason}
                                                onChange={(e) => setReportReason(e.target.value)}
                                                className="w-full rounded-lg border border-white/10 bg-navy-600 px-3 py-2 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                            >
                                                <option value="">Select a reason...</option>
                                                {REPORT_REASONS.map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="mt-4">
                                            <label className="mb-1.5 block text-sm font-medium text-gray-300">
                                                Details <span className="text-gray-500">(optional)</span>
                                            </label>
                                            <textarea
                                                value={reportDetails}
                                                onChange={(e) => setReportDetails(e.target.value)}
                                                rows={3}
                                                placeholder="Provide additional context..."
                                                className="w-full resize-none rounded-lg border border-white/10 bg-navy-600 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                            />
                                        </div>

                                        <div className="mt-5 flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowReportModal(false);
                                                    setReportReason('');
                                                    setReportDetails('');
                                                }}
                                                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition hover:text-white"
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
                            <h3 className="mb-4 text-lg font-bold text-white">
                                Games ({player.games.length})
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {player.games.map((game) => (
                                    <div key={game.id} className="card-gaming group overflow-hidden rounded-xl border border-white/5 bg-navy-800 transition">
                                        <div className="relative h-32 overflow-hidden">
                                            <img
                                                src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                alt={game.name}
                                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-navy-800 via-navy-800/40 to-transparent" />
                                            <div className="absolute bottom-3 left-4 right-4">
                                                <p className="text-lg font-bold text-white">{game.name}</p>
                                                <p className="text-xs text-gray-400">{game.genre}</p>
                                            </div>
                                            {game.pivot?.rank && (
                                                <div className="absolute right-3 top-3">
                                                    <span className="glow-border-green rounded-lg bg-navy-900/80 px-3 py-1 text-xs font-bold text-gaming-green backdrop-blur-sm">
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
                                                <span className="rounded-md bg-white/5 px-2.5 py-0.5 text-xs capitalize text-gray-400">
                                                    {game.pivot.platform}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Clips */}
                    {clips && clips.length > 0 && (
                        <div className="mt-8">
                            <h3 className="mb-4 text-lg font-bold text-white">
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
                                            className="card-gaming group overflow-hidden rounded-xl border border-white/5 bg-navy-800 transition"
                                        >
                                            <div className="relative aspect-video overflow-hidden">
                                                {thumbnail ? (
                                                    <img src={thumbnail} alt={clip.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gaming-purple/20 to-gaming-cyan/20">
                                                        <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gaming-purple/30 shadow-glow-purple backdrop-blur">
                                                        <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                    </div>
                                                </div>
                                                <div className="absolute right-2 top-2">
                                                    {platformBadge(clip.platform)}
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <p className="truncate text-sm font-semibold text-white">{clip.title}</p>
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
                        <div className="mt-8 glow-border rounded-xl border border-gaming-purple/20 bg-gaming-purple/5 p-8 text-center">
                            <p className="text-lg font-bold text-white">Want to team up with {username}?</p>
                            <p className="mt-1 text-sm text-gray-400">Create a free account to match and chat.</p>
                            <Link
                                href={route('register')}
                                className="mt-4 inline-block rounded-lg bg-gaming-purple px-6 py-3 text-sm font-bold text-white shadow-glow-purple transition hover:bg-gaming-purple/80"
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
        <div className="min-h-screen bg-navy-900 text-white">
            <nav className="flex items-center justify-between border-b border-white/5 bg-navy-900/80 px-6 py-4 backdrop-blur-xl lg:px-12">
                <Link href="/" className="text-2xl font-bold text-gaming-purple text-neon-purple">SquadSpawn</Link>
                <div className="flex items-center gap-4">
                    <Link href={route('login')} className="text-sm text-gray-300 hover:text-white">Log in</Link>
                    <Link href={route('register')} className="rounded-lg bg-gaming-purple px-4 py-2 text-sm font-semibold text-white shadow-glow-purple">Sign up</Link>
                </div>
            </nav>
            {pageContent}
        </div>
    );
}
