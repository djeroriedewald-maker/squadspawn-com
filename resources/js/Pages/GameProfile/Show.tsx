import SocialLinks from '@/Components/SocialLinks';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Clip, Game, PageProps, Profile } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function getYouTubeThumbnail(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
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

export default function Show({
    profile,
    userGames,
    clips = [],
}: PageProps<{ profile: Profile | null; userGames: Game[]; clips: Clip[] }>) {
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

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-white">My Profile</h2>}>
            <Head title="My Profile" />

            {/* Success toast */}
            {showToast && flash?.message && (
                <div className="fixed right-4 top-20 z-50 animate-pulse rounded-xl bg-gaming-green px-6 py-3 text-sm font-semibold text-navy-900 shadow-lg shadow-gaming-green/25">
                    {flash.message}
                </div>
            )}

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    {!profile ? (
                        <div className="rounded-2xl border border-white/10 bg-navy-800 p-12 text-center">
                            <p className="text-lg font-medium text-gray-400">You haven't set up your profile yet</p>
                            <Link
                                href={route('game-profile.edit')}
                                className="mt-6 inline-block rounded-xl bg-gaming-purple px-6 py-3 font-semibold text-white transition hover:bg-gaming-purple/90"
                            >
                                Set Up Profile
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Profile card */}
                            <div className="rounded-2xl border border-white/10 bg-navy-800 p-8">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-3xl font-bold text-white">
                                            {profile.avatar ? (
                                                <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" />
                                            ) : (
                                                profile.username[0]?.toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                {profile.looking_for && (
                                                    <span className="rounded-full bg-gaming-purple/20 px-3 py-0.5 text-xs font-medium text-gaming-purple">
                                                        {lookingForLabels[profile.looking_for] || profile.looking_for}
                                                    </span>
                                                )}
                                                {profile.region && (
                                                    <span className="rounded-full bg-white/5 px-3 py-0.5 text-xs font-medium text-gray-400">
                                                        {profile.region}
                                                    </span>
                                                )}
                                                {profile.timezone && (
                                                    <span className="rounded-full bg-white/5 px-3 py-0.5 text-xs font-medium text-gray-400">
                                                        {profile.timezone}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.origin + '/player/' + profile.username);
                                                setCopied(true);
                                                setTimeout(() => setCopied(false), 2000);
                                            }}
                                            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-300 transition hover:bg-navy-700 hover:text-white"
                                        >
                                            {copied ? 'Copied!' : 'Share'}
                                        </button>
                                        <Link
                                            href={route('game-profile.edit')}
                                            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-navy-700 hover:text-white"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>

                                {profile.bio && (
                                    <p className="mt-6 text-sm leading-relaxed text-gray-300">{profile.bio}</p>
                                )}

                                {profile.socials && Object.values(profile.socials).some(v => v) && (
                                    <div className="mt-4">
                                        <SocialLinks socials={profile.socials} />
                                    </div>
                                )}
                            </div>

                            {/* Games with covers */}
                            <div className="rounded-2xl border border-white/10 bg-navy-800 p-8">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-white">My Games</h3>
                                    <span className="text-sm text-gray-500">{userGames.length} game{userGames.length !== 1 ? 's' : ''}</span>
                                </div>
                                {userGames.length === 0 ? (
                                    <div className="text-center py-6">
                                        <p className="text-gray-500">No games added yet.</p>
                                        <Link href={route('game-profile.edit')} className="mt-3 inline-block text-sm text-gaming-purple hover:underline">Add Games</Link>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {userGames.map((game) => (
                                            <div key={game.id} className="overflow-hidden rounded-xl border border-white/5 bg-navy-900">
                                                <div className="relative h-24 overflow-hidden">
                                                    <img
                                                        src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                        alt={game.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent" />
                                                    <div className="absolute bottom-2 left-3">
                                                        <p className="font-bold text-white">{game.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 px-3 py-2.5">
                                                    {game.pivot?.rank && (
                                                        <span className="rounded-md bg-gaming-green/10 px-2.5 py-0.5 text-xs font-semibold text-gaming-green">
                                                            {game.pivot.rank}
                                                        </span>
                                                    )}
                                                    {game.pivot?.platform && (
                                                        <span className="rounded-md bg-white/5 px-2.5 py-0.5 text-xs text-gray-400 capitalize">
                                                            {game.pivot.platform}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-600">{game.genre}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Clips */}
                            {clips && clips.length > 0 && (
                                <div className="rounded-2xl border border-white/10 bg-navy-800 p-8">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-white">My Clips</h3>
                                        <Link href={route('clips.index')} className="text-sm text-gaming-purple hover:underline">View All</Link>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {clips.map((clip) => {
                                            const thumbnail = clip.thumbnail || (clip.platform === 'youtube' ? getYouTubeThumbnail(clip.url) : null);
                                            return (
                                                <a
                                                    key={clip.id}
                                                    href={clip.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group overflow-hidden rounded-xl border border-white/5 bg-navy-900 transition hover:border-gaming-purple/30"
                                                >
                                                    <div className="relative aspect-video overflow-hidden">
                                                        {thumbnail ? (
                                                            <img src={thumbnail} alt={clip.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gaming-purple/20 to-gaming-green/20">
                                                                <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                                                                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                            </div>
                                                        </div>
                                                        <div className="absolute right-2 top-2">
                                                            {platformBadge(clip.platform)}
                                                        </div>
                                                    </div>
                                                    <div className="p-2.5">
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
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
