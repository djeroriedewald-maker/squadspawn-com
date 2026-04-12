import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

interface MatchItem {
    id: number;
    partner: User;
    created_at: string;
}

export default function Dashboard({
    matchCount,
    recentMatches,
    allGames,
}: PageProps<{ matchCount: number; recentMatches: MatchItem[]; allGames: Game[] }>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const userGames = user.games || [];
    const hasProfile = !!user.profile?.username;
    const hasGames = userGames.length > 0;

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

                    {/* Onboarding Banner */}
                    {(!hasProfile || !hasGames) && (
                        <div className="mb-8 overflow-hidden rounded-2xl border border-gaming-purple/30 bg-gradient-to-r from-gaming-purple/10 to-gaming-green/10 p-6 sm:p-8">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">
                                        {!hasProfile ? 'Complete Your Gaming Profile' : 'Add Your Games'}
                                    </h2>
                                    <p className="mt-2 text-gray-400">
                                        {!hasProfile
                                            ? 'Set up your username, region, and bio so other gamers can find you.'
                                            : 'Add the games you play so we can match you with the right teammates.'}
                                    </p>
                                    <div className="mt-4 flex gap-2">
                                        <div className={`h-2 w-16 rounded-full ${hasProfile ? 'bg-gaming-green' : 'bg-gaming-purple'}`} />
                                        <div className={`h-2 w-16 rounded-full ${hasGames ? 'bg-gaming-green' : 'bg-white/10'}`} />
                                        <div className={`h-2 w-16 rounded-full ${matchCount > 0 ? 'bg-gaming-green' : 'bg-white/10'}`} />
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Step {!hasProfile ? '1' : !hasGames ? '2' : '3'} of 3: {!hasProfile ? 'Create profile' : !hasGames ? 'Add games' : 'Find players'}
                                    </p>
                                </div>
                                <Link
                                    href={route('game-profile.edit')}
                                    className="shrink-0 rounded-xl bg-gaming-purple px-6 py-3 font-bold text-white shadow-lg shadow-gaming-purple/25 transition hover:bg-gaming-purple/80"
                                >
                                    {!hasProfile ? 'Set Up Profile' : 'Add Games'}
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Welcome + Stats Row */}
                    <div className="mb-8 grid gap-4 lg:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6 lg:col-span-2">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-purple/20 text-2xl font-bold text-gaming-purple">
                                    {user.profile?.avatar ? (
                                        <img src={user.profile.avatar} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        user.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-bold text-white">Welcome back, {user.profile?.username || user.name}!</h3>
                                    <p className="text-sm text-gray-400">
                                        {user.profile?.region && <span>{user.profile.region} &middot; </span>}
                                        {user.profile?.looking_for && <span className="capitalize">{user.profile.looking_for}</span>}
                                        {!user.profile?.region && !user.profile?.looking_for && 'Ready to find your squad?'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6 text-center">
                            <p className="text-3xl font-bold text-gaming-purple">{userGames.length}</p>
                            <p className="mt-1 text-sm text-gray-400">Games</p>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6 text-center">
                            <p className="text-3xl font-bold text-gaming-green">{matchCount}</p>
                            <p className="mt-1 text-sm text-gray-400">Matches</p>
                        </div>
                    </div>

                    {/* My Games */}
                    <div className="mb-8">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">My Games</h3>
                            <Link href={route('game-profile.edit')} className="text-sm text-gaming-purple transition hover:text-gaming-purple/80">
                                Edit Games
                            </Link>
                        </div>
                        {hasGames ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {userGames.map((game) => (
                                    <Link
                                        key={game.id}
                                        href={route('discovery.index', { game_id: game.id })}
                                        className="group overflow-hidden rounded-xl border border-white/10 bg-navy-800 transition hover:border-gaming-purple/40"
                                    >
                                        <div className="relative h-28 overflow-hidden">
                                            <img
                                                src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                alt={game.name}
                                                className="h-full w-full object-cover transition group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 to-transparent" />
                                            <div className="absolute bottom-2 left-3 right-3">
                                                <p className="font-semibold text-white text-shadow">{game.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-2.5">
                                            <div className="flex items-center gap-2">
                                                {game.pivot?.rank && (
                                                    <span className="rounded-md bg-gaming-green/10 px-2 py-0.5 text-xs font-semibold text-gaming-green">
                                                        {game.pivot.rank}
                                                    </span>
                                                )}
                                                {game.pivot?.platform && (
                                                    <span className="text-xs text-gray-500 capitalize">{game.pivot.platform}</span>
                                                )}
                                            </div>
                                            <span className="text-xs text-gaming-purple opacity-0 transition group-hover:opacity-100">
                                                Find Players →
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-white/10 bg-navy-800/50 p-8 text-center">
                                <p className="text-gray-400">No games added yet</p>
                                <Link
                                    href={route('game-profile.edit')}
                                    className="mt-3 inline-block rounded-lg bg-gaming-purple/10 px-4 py-2 text-sm font-medium text-gaming-purple transition hover:bg-gaming-purple/20"
                                >
                                    Add Your First Game
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Recent Matches & Discover */}
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Recent Matches */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-white">Recent Matches</h3>
                                {matchCount > 0 && (
                                    <Link href={route('matches.index')} className="text-sm text-gaming-purple transition hover:text-gaming-purple/80">
                                        View All
                                    </Link>
                                )}
                            </div>
                            {recentMatches.length > 0 ? (
                                <div className="space-y-3">
                                    {recentMatches.map((match) => (
                                        <Link
                                            key={match.id}
                                            href={route('chat.show', { playerMatch: match.id })}
                                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800 p-4 transition hover:border-gaming-purple/30"
                                        >
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 font-bold text-white">
                                                {match.partner.profile?.avatar ? (
                                                    <img src={match.partner.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    (match.partner.profile?.username?.[0] || match.partner.name[0]).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-white">{match.partner.profile?.username || match.partner.name}</p>
                                                <p className="text-xs text-gray-500">{match.partner.profile?.region || 'No region'}</p>
                                            </div>
                                            <span className="shrink-0 rounded-lg bg-gaming-green/10 px-3 py-1 text-xs font-medium text-gaming-green">
                                                Chat
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-white/10 bg-navy-800/50 p-8 text-center">
                                    <p className="text-gray-400">No matches yet</p>
                                    <Link
                                        href={route('discovery.index')}
                                        className="mt-3 inline-block rounded-lg bg-gaming-purple/10 px-4 py-2 text-sm font-medium text-gaming-purple transition hover:bg-gaming-purple/20"
                                    >
                                        Discover Players
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Popular Games to Explore */}
                        <div>
                            <h3 className="mb-4 text-lg font-bold text-white">Explore Games</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {allGames.filter((g) => !userGames.find((ug) => ug.id === g.id)).slice(0, 9).map((game) => (
                                    <Link
                                        key={game.id}
                                        href={route('discovery.index', { game_id: game.id })}
                                        className="group relative overflow-hidden rounded-lg"
                                    >
                                        <img
                                            src={game.cover_image || `/images/games/${game.slug}.svg`}
                                            alt={game.name}
                                            className="aspect-[3/2] w-full object-cover transition group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/20" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-center text-xs font-bold text-white drop-shadow">{game.name}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <Link
                                href={route('games.index')}
                                className="mt-3 block text-center text-sm text-gray-400 transition hover:text-white"
                            >
                                View All Games →
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
