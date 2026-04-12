import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps, User } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface MatchItem {
    id: number;
    partner: User;
    created_at: string;
}

export default function Index({ matches }: PageProps<{ matches: MatchItem[] }>) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-bold text-white">Your Matches</h2>}>
            <Head title="Matches" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    {matches.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-navy-800 p-12 text-center">
                            <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                            </svg>
                            <p className="mt-4 text-lg font-medium text-gray-400">No matches yet</p>
                            <p className="mt-2 text-sm text-gray-500">Start discovering players to find your squad!</p>
                            <Link
                                href={route('discovery.index')}
                                className="mt-6 inline-block rounded-xl bg-gaming-purple px-6 py-3 font-semibold text-white transition hover:bg-gaming-purple/90"
                            >
                                Discover Players
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {matches.map((match) => (
                                <div
                                    key={match.id}
                                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-navy-800 p-5 transition hover:border-gaming-purple/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-xl font-bold text-white">
                                            {match.partner.profile?.username?.[0]?.toUpperCase() || match.partner.name[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">
                                                {match.partner.profile?.username || match.partner.name}
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {match.partner.profile?.region && (
                                                    <span className="text-sm text-gray-400">{match.partner.profile.region}</span>
                                                )}
                                                {match.partner.profile?.looking_for && (
                                                    <span className="rounded-full bg-gaming-purple/10 px-2 py-0.5 text-xs text-gaming-purple">
                                                        {match.partner.profile.looking_for}
                                                    </span>
                                                )}
                                            </div>
                                            {match.partner.games && match.partner.games.length > 0 && (
                                                <div className="mt-1 flex gap-1">
                                                    {match.partner.games.slice(0, 3).map((game) => (
                                                        <span key={game.id} className="text-xs text-gray-500">
                                                            {game.name}{match.partner.games!.indexOf(game) < Math.min(match.partner.games!.length, 3) - 1 ? ' · ' : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        href={route('chat.show', { match: match.id })}
                                        className="rounded-xl bg-gaming-green/10 px-5 py-2.5 font-semibold text-gaming-green transition hover:bg-gaming-green/20"
                                    >
                                        Chat
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
