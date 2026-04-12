import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

interface GameWithCount extends Game {
    users_count: number;
}

interface FriendItem {
    id: number;
    partner: User;
    created_at: string;
}

export default function Dashboard({
    matchCount,
    recentMatches,
    allGames,
    likedByCount,
    suggestedPlayers,
}: PageProps<{
    matchCount: number;
    recentMatches: FriendItem[];
    allGames: GameWithCount[];
    likedByCount: number;
    suggestedPlayers: User[];
}>) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const userGames = user.games || [];
    const hasProfile = !!user.profile?.username;
    const hasGames = userGames.length > 0;
    const mainGame = userGames[0];

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="pb-8">
                {/* Hero Banner with main game background */}
                <div className="relative overflow-hidden">
                    {mainGame ? (
                        <div className="absolute inset-0">
                            <img
                                src={mainGame.cover_image || `/images/games/${mainGame.slug}.svg`}
                                alt=""
                                className="h-full w-full object-cover opacity-20"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-navy-900/40 via-navy-900/80 to-navy-900" />
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-gaming-purple/10 to-navy-900" />
                    )}

                    <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
                        {/* Onboarding */}
                        {(!hasProfile || !hasGames) && (
                            <div className="mb-6 overflow-hidden rounded-2xl border border-gaming-purple/30 bg-navy-800/80 p-6 backdrop-blur-sm">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {!hasProfile ? 'Complete Your Gaming Profile' : 'Add Your Games'}
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-400">
                                            {!hasProfile ? 'Set up your username and bio so gamers can find you.' : 'Add games to get matched with the right players.'}
                                        </p>
                                        <div className="mt-3 flex gap-2">
                                            <div className={`h-1.5 w-12 rounded-full ${hasProfile ? 'bg-gaming-green' : 'bg-gaming-purple'}`} />
                                            <div className={`h-1.5 w-12 rounded-full ${hasGames ? 'bg-gaming-green' : 'bg-white/10'}`} />
                                            <div className={`h-1.5 w-12 rounded-full ${matchCount > 0 ? 'bg-gaming-green' : 'bg-white/10'}`} />
                                        </div>
                                    </div>
                                    <Link href={route('game-profile.edit')} className="shrink-0 rounded-xl bg-gaming-purple px-6 py-2.5 font-bold text-white shadow-lg shadow-gaming-purple/25 transition hover:bg-gaming-purple/80">
                                        {!hasProfile ? 'Set Up Profile' : 'Add Games'}
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Welcome Row */}
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-gaming-purple/50 bg-gaming-purple/20 text-2xl font-bold text-gaming-purple">
                                    {user.profile?.avatar ? (
                                        <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        user.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">Welcome back, {user.profile?.username || user.name}!</h1>
                                    <p className="text-sm text-gray-400">
                                        {user.profile?.region && <>{user.profile.region} &middot; </>}
                                        {userGames.length} games &middot; {matchCount} friends
                                    </p>
                                </div>
                            </div>
                            <Link href={route('discovery.index')} className="rounded-xl bg-gaming-purple px-6 py-3 text-center font-bold text-white shadow-lg shadow-gaming-purple/25 transition hover:bg-gaming-purple/80">
                                Discover Players
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="-mt-1 mb-8 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gaming-purple/10">
                                    <svg className="h-5 w-5 text-gaming-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{userGames.length}</p>
                                    <p className="text-xs text-gray-500">Games</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gaming-green/10">
                                    <svg className="h-5 w-5 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{matchCount}</p>
                                    <p className="text-xs text-gray-500">Friends</p>
                                </div>
                            </div>
                        </div>
                        <Link href={route('discovery.index')} className="rounded-xl border border-gaming-pink/20 bg-gaming-pink/5 p-4 transition hover:border-gaming-pink/40 hover:bg-gaming-pink/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gaming-pink/10">
                                    <svg className="h-5 w-5 text-gaming-pink" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gaming-pink">{likedByCount}</p>
                                    <p className="text-xs text-gray-500">Gamers liked you</p>
                                </div>
                            </div>
                        </Link>
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{user.profile?.region || '--'}</p>
                                    <p className="text-xs text-gray-500">Region</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* My Games - Quick Play */}
                    <div className="mb-8">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">My Games</h2>
                            <Link href={route('game-profile.edit')} className="text-sm text-gaming-purple hover:text-gaming-purple/80">Edit Games</Link>
                        </div>
                        {hasGames ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {userGames.map((game) => (
                                    <div key={game.id} className="group overflow-hidden rounded-xl border border-white/10 bg-navy-800 transition hover:border-gaming-purple/40">
                                        <div className="relative h-28 overflow-hidden">
                                            <img src={game.cover_image || `/images/games/${game.slug}.svg`} alt={game.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent" />
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="font-bold text-white">{game.name}</p>
                                                <div className="flex items-center gap-2">
                                                    {game.pivot?.rank && <span className="text-xs font-medium text-gaming-green">{game.pivot.rank}</span>}
                                                    {game.pivot?.platform && <span className="text-xs text-gray-400 capitalize">{game.pivot.platform}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <Link
                                            href={route('discovery.index', { game_id: game.id })}
                                            className="flex items-center justify-center gap-2 border-t border-white/5 px-3 py-2.5 text-sm font-medium text-gaming-purple transition hover:bg-gaming-purple/10"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                            </svg>
                                            Find Players
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-white/10 bg-navy-800/50 p-8 text-center">
                                <p className="text-gray-400">Add games to start finding teammates</p>
                                <Link href={route('game-profile.edit')} className="mt-3 inline-block rounded-lg bg-gaming-purple/10 px-4 py-2 text-sm font-medium text-gaming-purple hover:bg-gaming-purple/20">Add Your First Game</Link>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Suggested Players */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Suggested Players</h2>
                                <Link href={route('discovery.index')} className="text-sm text-gaming-purple hover:text-gaming-purple/80">View All</Link>
                            </div>
                            {suggestedPlayers.length > 0 ? (
                                <div className="space-y-3">
                                    {suggestedPlayers.map((player) => (
                                        <Link
                                            key={player.id}
                                            href={route('player.show', { username: player.profile?.username || player.id })}
                                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800 p-4 transition hover:border-gaming-purple/30"
                                        >
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 font-bold text-white">
                                                {player.profile?.avatar ? (
                                                    <img src={player.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    (player.profile?.username?.[0] || player.name[0]).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-white">{player.profile?.username || player.name}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {player.games?.slice(0, 2).map((g) => (
                                                        <span key={g.id} className="flex items-center gap-1 rounded bg-navy-900 px-1.5 py-0.5">
                                                            <img src={g.cover_image || `/images/games/${g.slug}.svg`} alt="" className="h-3 w-5 rounded-sm object-cover" />
                                                            <span className="text-[10px] text-gray-400">{g.pivot?.rank || g.name.split(':')[0].split(' ').slice(0,2).join(' ')}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            {player.profile?.region && (
                                                <span className="shrink-0 text-xs text-gray-500">{player.profile.region}</span>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-white/10 bg-navy-800/50 p-8 text-center">
                                    <p className="text-gray-400">{hasGames ? 'No suggestions yet — more players coming soon!' : 'Add games to see suggested players'}</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Friends */}
                        <div>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Recent Friends</h2>
                                {matchCount > 0 && <Link href={route('friends.index')} className="text-sm text-gaming-purple hover:text-gaming-purple/80">View All</Link>}
                            </div>
                            {recentMatches.length > 0 ? (
                                <div className="space-y-3">
                                    {recentMatches.map((match) => (
                                        <Link
                                            key={match.id}
                                            href={route('chat.show', { playerMatch: match.id })}
                                            className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800 p-4 transition hover:border-gaming-green/30"
                                        >
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 font-bold text-white">
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
                                            <span className="shrink-0 rounded-lg bg-gaming-green/10 px-3 py-1.5 text-xs font-medium text-gaming-green">Chat</span>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-white/10 bg-navy-800/50 p-8 text-center">
                                    <p className="text-gray-400">No friends yet</p>
                                    <Link href={route('discovery.index')} className="mt-3 inline-block rounded-lg bg-gaming-purple/10 px-4 py-2 text-sm font-medium text-gaming-purple hover:bg-gaming-purple/20">Discover Players</Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Explore More Games */}
                    {allGames.filter((g) => !userGames.find((ug) => ug.id === g.id)).length > 0 && (
                        <div className="mt-8">
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white">Explore More Games</h2>
                                <Link href={route('games.index')} className="text-sm text-gaming-purple hover:text-gaming-purple/80">View All</Link>
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                                {allGames.filter((g) => !userGames.find((ug) => ug.id === g.id)).slice(0, 6).map((game) => (
                                    <Link
                                        key={game.id}
                                        href={route('discovery.index', { game_id: game.id })}
                                        className="group relative overflow-hidden rounded-lg"
                                    >
                                        <img src={game.cover_image || `/images/games/${game.slug}.svg`} alt={game.name} className="aspect-[3/2] w-full object-cover transition group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/20" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-1">
                                            <span className="text-xs font-bold text-white drop-shadow">{game.name.split(':')[0]}</span>
                                            <span className="text-[10px] text-gray-300">{game.users_count} players</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
