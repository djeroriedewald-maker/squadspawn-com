import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function PlayerShow({ player }: PageProps<{ player: User }>) {
    const { auth } = usePage<PageProps>().props;
    const isLoggedIn = !!auth?.user;
    const isOwnProfile = auth?.user?.id === player.id;

    const lookingForLabels: Record<string, string> = {
        casual: 'Casual', ranked: 'Ranked', friends: 'Friends', any: 'Open to Anything',
    };

    const pageContent = (
        <>
            <Head title={`${player.profile?.username || player.name} - Player Profile`} />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    {/* Profile card */}
                    <div className="rounded-2xl border border-white/10 bg-navy-800 p-8">
                        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-4xl font-bold text-white">
                                {player.profile?.avatar ? (
                                    <img src={player.profile.avatar} alt={player.profile.username} className="h-full w-full object-cover" />
                                ) : (
                                    (player.profile?.username?.[0] || player.name[0]).toUpperCase()
                                )}
                            </div>
                            <div className="text-center sm:text-left">
                                <h1 className="text-2xl font-bold text-white">
                                    {player.profile?.username || player.name}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
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
                                {player.profile?.bio && (
                                    <p className="mt-4 text-sm leading-relaxed text-gray-300">{player.profile.bio}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Games */}
                    {player.games && player.games.length > 0 && (
                        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-800 p-8">
                            <h3 className="mb-4 text-lg font-bold text-white">
                                Games ({player.games.length})
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {player.games.map((game) => (
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
                                                <span className="rounded-md bg-white/5 px-2.5 py-0.5 text-xs capitalize text-gray-400">
                                                    {game.pivot.platform}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-600">{game.genre}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {/* CTA for guests */}
                    {!isLoggedIn && (
                        <div className="mt-6 rounded-xl border border-gaming-purple/20 bg-gaming-purple/5 p-6 text-center">
                            <p className="font-semibold text-white">Want to team up with {player.profile?.username}?</p>
                            <p className="mt-1 text-sm text-gray-400">Create a free account to match and chat.</p>
                            <Link
                                href={route('register')}
                                className="mt-3 inline-block rounded-lg bg-gaming-purple px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gaming-purple/80"
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
            <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                <Link href="/" className="text-2xl font-bold text-gaming-purple">SquadSpawn</Link>
                <div className="flex items-center gap-4">
                    <Link href={route('login')} className="text-sm text-gray-300 hover:text-white">Log in</Link>
                    <Link href={route('register')} className="rounded-lg bg-gaming-purple px-4 py-2 text-sm font-semibold text-white">Sign up</Link>
                </div>
            </nav>
            {pageContent}
        </div>
    );
}
