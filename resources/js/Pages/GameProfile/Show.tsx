import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, Profile } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Show({
    profile,
    userGames,
}: PageProps<{ profile: Profile | null; userGames: Game[] }>) {
    const { flash } = usePage().props as any;
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
                                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-3xl font-bold text-white">
                                            {profile.username[0]?.toUpperCase()}
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
                                    <Link
                                        href={route('game-profile.edit')}
                                        className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-navy-700 hover:text-white"
                                    >
                                        Edit
                                    </Link>
                                </div>

                                {profile.bio && (
                                    <p className="mt-6 text-sm leading-relaxed text-gray-300">{profile.bio}</p>
                                )}
                            </div>

                            {/* Games */}
                            <div className="rounded-2xl border border-white/10 bg-navy-800 p-8">
                                <h3 className="mb-4 text-lg font-bold text-white">My Games</h3>
                                {userGames.length === 0 ? (
                                    <p className="text-sm text-gray-500">No games added yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {userGames.map((game) => (
                                            <div key={game.id} className="flex items-center justify-between rounded-xl bg-navy-900 p-4">
                                                <div>
                                                    <p className="font-semibold text-white">{game.name}</p>
                                                    <p className="text-xs text-gray-500">{game.genre} &middot; {game.platforms.join(', ')}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {game.pivot?.rank && (
                                                        <span className="rounded-lg bg-gaming-green/10 px-3 py-1 text-sm font-medium text-gaming-green">
                                                            {game.pivot.rank}
                                                        </span>
                                                    )}
                                                    {game.pivot?.platform && (
                                                        <span className="rounded-lg bg-white/5 px-3 py-1 text-sm text-gray-400">
                                                            {game.pivot.platform}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
