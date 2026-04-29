import FounderBadge from '@/Components/FounderBadge';
import GuestLayout from '@/Layouts/GuestLayout';
import { gameCoverUrl } from '@/utils/gameImage';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface PlayerGame {
    name: string;
    slug: string;
    cover_image?: string | null;
    rank?: string | null;
    role?: string | null;
    platform?: string | null;
}

interface Player {
    id: number;
    name: string;
    username: string | null;
    avatar: string | null;
    bio?: string | null;
    region?: string | null;
    looking_for?: string | null;
    has_mic: boolean;
    is_live: boolean;
    reputation_score?: number | null;
    level?: number | null;
    founder_number: number | null;
    is_og_founder: boolean;
    joined_human: string;
    games: PlayerGame[];
}

interface Props {
    player: Player;
}

export default function PlayerCard({ player }: Props) {
    const displayName = player.username ?? player.name;
    const initial = (player.username ?? player.name)[0]?.toUpperCase() ?? '?';
    const isOg = player.is_og_founder;
    const authedUser = (usePage().props as { auth?: { user?: { id?: number } } }).auth?.user;
    const isOwnCard = authedUser?.id === player.id;

    const [copied, setCopied] = useState(false);
    function copyShareUrl() {
        const url = window.location.href;
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => alert('Could not copy URL — copy from the address bar.'));
    }

    const headlineRep = player.reputation_score ? Number(player.reputation_score).toFixed(1) : null;

    return (
        <GuestLayout>
            <Head title={`${displayName} · Gamer card`} />

            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-12">
                <div className="w-full">
                    <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-neon-red">
                        SquadSpawn · Gamer card
                    </p>

                    <article
                        className={`relative overflow-hidden rounded-3xl border bg-white shadow-2xl ${
                            isOg
                                ? 'border-yellow-400/40 shadow-amber-500/10'
                                : 'border-neon-red/30 shadow-neon-red/10'
                        }`}
                    >
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${
                                isOg
                                    ? 'from-yellow-400/15 via-amber-500/5 to-transparent'
                                    : 'from-neon-red/10 via-gaming-pink/5 to-transparent'
                            } pointer-events-none`}
                        />

                        <div className="relative p-8 sm:p-10">
                            <div className="flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <div
                                        className={`flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ring-4 ${
                                            isOg ? 'ring-yellow-400/40' : 'ring-neon-red/30'
                                        }`}
                                    >
                                        {player.avatar ? (
                                            <img src={player.avatar} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div
                                                className={`flex h-full w-full items-center justify-center text-3xl font-black text-white ${
                                                    isOg
                                                        ? 'bg-gradient-to-br from-yellow-400 to-amber-600'
                                                        : 'bg-gradient-to-br from-neon-red to-gaming-pink'
                                                }`}
                                            >
                                                {initial}
                                            </div>
                                        )}
                                    </div>
                                    {player.is_live && (
                                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gaming-green px-2 py-0.5 text-[10px] font-bold text-white shadow ring-2 ring-white">
                                            LIVE
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">{displayName}</h1>
                                <p className="mt-1 text-xs text-ink-500">Joined {player.joined_human}</p>

                                {(player.founder_number || player.is_og_founder) && (
                                    <div className="mt-4">
                                        <FounderBadge
                                            number={player.founder_number}
                                            isOgFounder={player.is_og_founder}
                                            size="md"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Stats strip */}
                            <div className="mt-6 grid grid-cols-3 gap-2">
                                <div className="rounded-xl border border-ink-900/10 bg-bone-50/60 px-3 py-3 text-center">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Reputation</div>
                                    <div className="mt-1 text-lg font-black text-yellow-500">
                                        {headlineRep ? <>★ {headlineRep}</> : '--'}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-ink-900/10 bg-bone-50/60 px-3 py-3 text-center">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Region</div>
                                    <div className="mt-1 truncate text-sm font-bold text-ink-900">{player.region ?? '--'}</div>
                                </div>
                                <div className="rounded-xl border border-ink-900/10 bg-bone-50/60 px-3 py-3 text-center">
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Looking for</div>
                                    <div className="mt-1 truncate text-sm font-bold text-ink-900">
                                        {player.looking_for === 'any' ? 'Open' : (player.looking_for ?? '--')}
                                    </div>
                                </div>
                            </div>

                            {/* Mic + Level chips */}
                            {(player.has_mic || (player.level && player.level > 1)) && (
                                <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                                    {player.has_mic && (
                                        <span className="rounded-full bg-gaming-cyan/10 px-2.5 py-1 font-semibold text-gaming-cyan">
                                            🎙 Mic on
                                        </span>
                                    )}
                                    {player.level && player.level > 1 && (
                                        <span className="rounded-full bg-yellow-400/10 px-2.5 py-1 font-semibold text-yellow-500">
                                            Lv.{player.level}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Games */}
                            {player.games.length > 0 && (
                                <div className="mt-6">
                                    <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-ink-500">
                                        Plays
                                    </div>
                                    <div className="space-y-2">
                                        {player.games.map((g) => (
                                            <div
                                                key={g.slug}
                                                className="flex items-center gap-3 rounded-xl border border-ink-900/5 bg-white px-3 py-2"
                                            >
                                                <div className="h-8 w-12 shrink-0 overflow-hidden rounded-md bg-ink-900/10">
                                                    <img
                                                        src={gameCoverUrl(g.cover_image, 'thumb') || `/images/games/${g.slug}.svg`}
                                                        alt=""
                                                        loading="lazy"
                                                        decoding="async"
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-sm font-bold text-ink-900">{g.name}</div>
                                                    {(g.rank || g.role || g.platform) && (
                                                        <div className="truncate text-[11px] text-ink-500">
                                                            {[g.rank, g.role, g.platform].filter(Boolean).join(' · ')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {player.bio && (
                                <p className="mt-6 text-center text-sm italic text-ink-700">
                                    "{player.bio}"
                                </p>
                            )}

                            {/* CTA row */}
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                {!authedUser && (
                                    <Link
                                        href={route('register')}
                                        className="rounded-xl bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-md shadow-neon-red/30 hover:bg-neon-red/90"
                                    >
                                        Squad up with {displayName} →
                                    </Link>
                                )}
                                {isOwnCard && (
                                    <button
                                        type="button"
                                        onClick={copyShareUrl}
                                        className="rounded-xl border border-ink-900/10 bg-white px-6 py-3 text-sm font-bold text-ink-700 hover:border-neon-red/30 hover:text-neon-red"
                                    >
                                        {copied ? '✓ Link copied' : 'Copy share link'}
                                    </button>
                                )}
                                {!isOwnCard && authedUser && player.username && (
                                    <Link
                                        href={route('player.show', { username: player.username })}
                                        className="rounded-xl border border-ink-900/10 bg-white px-6 py-3 text-sm font-bold text-ink-700 hover:border-neon-red/30 hover:text-neon-red"
                                    >
                                        View full profile →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </article>

                    <p className="mt-6 text-center text-xs text-ink-500">
                        <Link href="/" className="hover:text-neon-red">
                            ← Back to SquadSpawn
                        </Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
