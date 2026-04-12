import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface FriendItem {
    id: number;
    partner: User;
    created_at: string;
    last_message: { body: string; sender_id: number; created_at: string } | null;
    unread_count: number;
    common_games: Game[];
}

export default function Index({ matches }: PageProps<{ matches: FriendItem[] }>) {
    return (
        <AuthenticatedLayout>
            <Head title="Friends" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white">Friends</h1>
                            <p className="text-sm text-gray-400">{matches.length} {matches.length === 1 ? 'friend' : 'friends'}</p>
                        </div>
                        <Link
                            href={route('discovery.index')}
                            className="rounded-xl bg-gaming-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gaming-purple/80"
                        >
                            Find More
                        </Link>
                    </div>

                    {matches.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-navy-800 p-16 text-center">
                            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gaming-purple/10">
                                <svg className="h-12 w-12 text-gaming-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-white">No friends yet</h3>
                            <p className="mb-6 text-gray-400">Discover players and start building your squad!</p>
                            <Link
                                href={route('discovery.index')}
                                className="inline-block rounded-xl bg-gaming-purple px-8 py-3 font-bold text-white shadow-lg shadow-gaming-purple/25 transition hover:bg-gaming-purple/80"
                            >
                                Discover Players
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {matches.map((match) => (
                                <div
                                    key={match.id}
                                    className="group overflow-hidden rounded-2xl border border-white/10 bg-navy-800 transition hover:border-gaming-purple/30"
                                >
                                    {/* Game cover banner */}
                                    {match.common_games.length > 0 && (
                                        <div className="relative h-16 overflow-hidden">
                                            <div className="flex h-full">
                                                {match.common_games.slice(0, 3).map((game, i) => (
                                                    <div key={game.id} className="flex-1 overflow-hidden" style={{ marginLeft: i > 0 ? '-1px' : 0 }}>
                                                        <img
                                                            src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-navy-800" />
                                            <div className="absolute bottom-1.5 left-3 flex items-center gap-1">
                                                {match.common_games.slice(0, 3).map((game) => (
                                                    <span key={game.id} className="rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
                                                        {game.name.split(':')[0].split(' ').slice(0, 2).join(' ')}
                                                    </span>
                                                ))}
                                                {match.common_games.length > 3 && (
                                                    <span className="rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-gray-300 backdrop-blur-sm">
                                                        +{match.common_games.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 p-4">
                                        <Link
                                            href={route('player.show', { username: match.partner.profile?.username || match.partner.id })}
                                            className="flex flex-1 items-center gap-4 transition hover:opacity-80"
                                        >
                                            {/* Avatar */}
                                            <div className="shrink-0">
                                                <div className="relative">
                                                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-xl font-bold text-white ring-2 ring-white/10">
                                                        {match.partner.profile?.avatar ? (
                                                            <img src={match.partner.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            (match.partner.profile?.username?.[0] || match.partner.name[0]).toUpperCase()
                                                        )}
                                                    </div>
                                                    {match.unread_count > 0 && (
                                                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gaming-pink text-[10px] font-bold text-white">
                                                            {match.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate font-bold text-white">
                                                        {match.partner.profile?.username || match.partner.name}
                                                    </span>
                                                {match.partner.profile?.looking_for && (
                                                    <span className="shrink-0 rounded-full bg-gaming-purple/10 px-2 py-0.5 text-[10px] font-medium text-gaming-purple">
                                                        {match.partner.profile.looking_for}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Last message or region */}
                                            {match.last_message ? (
                                                <p className={`mt-0.5 truncate text-sm ${match.unread_count > 0 ? 'font-medium text-white' : 'text-gray-400'}`}>
                                                    {match.last_message.body}
                                                </p>
                                            ) : (
                                                <p className="mt-0.5 text-sm text-gray-500 italic">No messages yet — say hi!</p>
                                            )}

                                            {/* Games + time */}
                                            <div className="mt-1 flex items-center gap-2">
                                                {match.partner.games && match.partner.games.length > 0 && (
                                                    <div className="flex -space-x-1">
                                                        {match.partner.games.slice(0, 4).map((game) => (
                                                            <img
                                                                key={game.id}
                                                                src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                                alt={game.name}
                                                                title={game.name}
                                                                className="h-5 w-7 rounded-sm border border-navy-800 object-cover"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                {match.partner.profile?.region && (
                                                    <span className="text-[10px] text-gray-600">{match.partner.profile.region}</span>
                                                )}
                                            </div>
                                        </div>
                                        </Link>

                                        {/* Actions */}
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <Link
                                                href={route('chat.show', { playerMatch: match.id })}
                                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                                    match.unread_count > 0
                                                        ? 'animate-pulse-glow bg-gaming-green text-white hover:bg-gaming-green/80'
                                                        : 'bg-gaming-green/10 text-gaming-green hover:bg-gaming-green/20'
                                                }`}
                                            >
                                                {match.unread_count > 0 ? `${match.unread_count} new` : 'Chat'}
                                            </Link>
                                            {match.last_message && (
                                                <span className="text-[10px] text-gray-600">{match.last_message.created_at}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
