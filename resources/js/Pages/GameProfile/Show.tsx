import SocialLinks from '@/Components/SocialLinks';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Achievement, Clip, Game, PageProps, Profile } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const achievementIconMap: Record<string, string> = {
    heart: '\u2764\uFE0F',
    users: '\uD83D\uDC65',
    flag: '\uD83D\uDEA9',
    shield: '\uD83D\uDEE1\uFE0F',
    video: '\uD83C\uDFA5',
    gamepad: '\uD83C\uDFAE',
    chat: '\uD83D\uDCAC',
    star: '\u2B50',
    trophy: '\uD83C\uDFC6',
    megaphone: '\uD83D\uDCE3',
    fire: '\uD83D\uDD25',
    check: '\u2705',
};

const achievementColorMap: Record<string, string> = {
    purple: 'bg-neon-red/20 border-neon-red/40',
    green: 'bg-gaming-green/20 border-gaming-green/40',
    cyan: 'bg-gaming-cyan/20 border-gaming-cyan/40',
    pink: 'bg-gaming-pink/20 border-gaming-pink/40',
    orange: 'bg-gaming-orange/20 border-gaming-orange/40',
};

function StarRating({ score }: { score: number }) {
    const fullStars = Math.floor(score);
    const hasHalf = score - fullStars >= 0.25 && score - fullStars < 0.75;
    const extraFull = score - fullStars >= 0.75;
    const totalFull = fullStars + (extraFull ? 1 : 0);
    const stars = [];

    for (let i = 0; i < totalFull; i++) {
        stars.push(
            <svg key={`full-${i}`} className="h-4 w-4 text-gaming-orange" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        );
    }
    if (hasHalf) {
        stars.push(
            <svg key="half" className="h-4 w-4 text-gaming-orange" viewBox="0 0 20 20">
                <defs>
                    <linearGradient id="halfStar">
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor="#374151" />
                    </linearGradient>
                </defs>
                <path fill="url(#halfStar)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        );
    }
    const remaining = 5 - totalFull - (hasHalf ? 1 : 0);
    for (let i = 0; i < remaining; i++) {
        stars.push(
            <svg key={`empty-${i}`} className="h-4 w-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        );
    }

    return <div className="flex items-center gap-0.5">{stars}</div>;
}

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

export default function Show({
    profile,
    userGames,
    clips = [],
    earnedAchievements = [],
    reputationData,
    friendsCount = 0,
}: PageProps<{ profile: Profile | null; userGames: Game[]; clips: Clip[]; earnedAchievements: Achievement[]; reputationData?: { score: number; count: number; tags: Record<string, number> }; friendsCount?: number }>) {
    const { flash } = usePage().props as any;
    const [copied, setCopied] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (flash?.message) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.message]);

    const lookingForLabels: Record<string, string> = {
        casual: 'Casual',
        ranked: 'Ranked',
        friends: 'Friends',
        any: 'Open to Anything',
    };

    const mainGame = userGames.length > 0 ? userGames[0] : null;

    return (
        <AuthenticatedLayout>
            <Head title="My Profile" />

            {/* Success toast */}
            {showToast && flash?.message && (
                <div className="fixed right-4 top-20 z-50 animate-pulse rounded-xl bg-gaming-green px-6 py-3 text-sm font-semibold text-ink-900 shadow-lg shadow-glow-green">
                    {flash.message}
                </div>
            )}

            {!profile ? (
                <div className="py-8">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="card-gaming rounded-2xl border border-ink-900/10 bg-white p-12 text-center">
                            <p className="text-lg font-medium text-ink-500">You haven't set up your profile yet</p>
                            <Link
                                href={route('game-profile.edit')}
                                className="mt-6 inline-block rounded-xl bg-neon-red px-6 py-3 font-semibold text-white shadow-glow-red transition hover:bg-neon-red/90"
                            >
                                Set Up Profile
                            </Link>
                        </div>
                    </div>
                </div>
            ) : (
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
                            <div className="h-full w-full bg-gradient-to-r from-neon-red/30 via-white to-gaming-cyan/30" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-bone-50 via-bone-50/60 to-transparent" />
                        <div className="absolute inset-0 bg-grid opacity-20" />
                    </div>

                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        {/* Avatar + Header */}
                        <div className="relative -mt-16 flex flex-col items-center sm:flex-row sm:items-end sm:gap-6">
                            {/* Avatar with gradient border */}
                            <div className="gradient-border relative z-10 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-4xl font-bold text-ink-900">
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" />
                                ) : (
                                    profile.username[0]?.toUpperCase()
                                )}
                            </div>

                            <div className="mt-4 flex flex-1 flex-col items-center gap-3 sm:mt-0 sm:flex-row sm:items-end sm:justify-between">
                                <div className="text-center sm:text-left">
                                    <h1 className={`text-3xl font-bold text-ink-900 ${profile.is_creator ? 'text-neon-red' : ''}`}>
                                        {profile.username}
                                    </h1>
                                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                        {profile.is_creator && (
                                            <span className="glow-border-cyan rounded-full bg-gaming-cyan/10 px-3 py-0.5 text-xs font-bold text-gaming-cyan">
                                                Creator
                                            </span>
                                        )}
                                        {profile.is_live && (
                                            <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-0.5 text-xs font-bold text-red-400">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                                                </span>
                                                Currently Live
                                            </span>
                                        )}
                                        {profile.looking_for && (
                                            <span className="rounded-full bg-neon-red/20 px-3 py-0.5 text-xs font-medium text-neon-red">
                                                {lookingForLabels[profile.looking_for] || profile.looking_for}
                                            </span>
                                        )}
                                        {profile.region && (
                                            <span className="rounded-full bg-ink-900/5 px-3 py-0.5 text-xs font-medium text-ink-500">
                                                {profile.region}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.origin + '/player/' + profile.username);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:border-neon-red/30 hover:bg-bone-100 hover:text-ink-900"
                                    >
                                        {copied ? 'Copied!' : 'Share'}
                                    </button>
                                    <Link
                                        href={route('game-profile.edit')}
                                        className="rounded-lg bg-neon-red px-4 py-2 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                                    >
                                        Edit Profile
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="glow-border rounded-xl border border-ink-900/5 bg-white p-4 text-center">
                                <p className="text-2xl font-bold text-neon-red">{userGames.length}</p>
                                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Games</p>
                            </div>
                            <div className="glow-border-green rounded-xl border border-ink-900/5 bg-white p-4 text-center">
                                <p className="text-2xl font-bold text-neon-green text-gaming-green">{clips.length}</p>
                                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Clips</p>
                            </div>
                            <div className="glow-border-cyan rounded-xl border border-ink-900/5 bg-white p-4 text-center">
                                <p className="text-2xl font-bold text-gaming-cyan text-neon-cyan">{friendsCount}</p>
                                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Friends</p>
                            </div>
                            <div className="rounded-xl border border-gaming-orange/20 bg-white p-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <StarRating score={profile.reputation_score || 0} />
                                    <span className="text-sm font-bold text-gaming-orange">{profile.reputation_score || '0.0'}</span>
                                </div>
                                <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-gray-500">Reputation</p>
                            </div>
                        </div>

                        {/* Bio */}
                        {profile.bio && (
                            <div className="card-gaming mt-6 rounded-2xl border border-ink-900/5 bg-white p-6">
                                <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-gray-500">About</h3>
                                <p className="text-sm leading-relaxed text-ink-700">{profile.bio}</p>
                            </div>
                        )}

                        {/* Socials */}
                        {profile.socials && Object.values(profile.socials).some(v => v) && (
                            <div className="mt-4">
                                <SocialLinks socials={profile.socials} />
                            </div>
                        )}

                        {/* Achievements */}
                        {earnedAchievements.length > 0 && (
                            <div className="mt-6">
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Achievements</h3>
                                    <Link href={route('achievements.index')} className="text-xs text-neon-red hover:underline">
                                        View All
                                    </Link>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {earnedAchievements.map((achievement) => {
                                        const colorCls = achievementColorMap[achievement.color] || achievementColorMap.purple;
                                        return (
                                            <div
                                                key={achievement.id}
                                                className={`group relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 ${colorCls}`}
                                                title={`${achievement.name}: ${achievement.description}`}
                                            >
                                                <span className="text-base">{achievementIconMap[achievement.icon] || '\uD83C\uDFC6'}</span>
                                                <span className="text-xs font-semibold text-ink-700">{achievement.name}</span>
                                                {/* Tooltip */}
                                                <div className="pointer-events-none absolute -top-10 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-bone-100 px-3 py-1.5 text-xs text-ink-700 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                                    {achievement.description}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Games */}
                        <div className="mt-8">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-ink-900">My Games</h3>
                                <span className="text-sm text-gray-500">{userGames.length} game{userGames.length !== 1 ? 's' : ''}</span>
                            </div>
                            {userGames.length === 0 ? (
                                <div className="card-gaming rounded-2xl border border-ink-900/5 bg-white py-8 text-center">
                                    <p className="text-gray-500">No games added yet.</p>
                                    <Link href={route('game-profile.edit')} className="mt-3 inline-block text-sm text-neon-red hover:underline">Add Games</Link>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {userGames.map((game) => (
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
                            )}
                        </div>

                        {/* Clips */}
                        {clips && clips.length > 0 && (
                            <div className="mt-8">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-ink-900">My Clips</h3>
                                    <Link href={route('clips.index')} className="text-sm text-neon-red hover:underline">View All</Link>
                                </div>
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
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
