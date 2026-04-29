import SeoHead from '@/Components/SeoHead';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { gameCoverUrl } from '@/utils/gameImage';
import { Head, Link, usePage } from '@inertiajs/react';

interface GameInfo {
    id: number;
    name: string;
    slug: string;
    cover_image?: string | null;
    genre?: string | null;
    platforms?: string[] | null;
    rank_system?: string[] | null;
    description?: string | null;
    players_count: number;
}

interface TopPlayer {
    id: number;
    name: string;
    username?: string | null;
    avatar?: string | null;
    reputation_score?: number | null;
    region?: string | null;
    looking_for?: string | null;
    has_mic?: boolean;
    is_live?: boolean;
}

interface RecentLfg {
    slug: string;
    title: string;
    spots_needed: number;
    spots_filled: number;
    platform: string;
    created_at_human: string;
    user: { username: string; avatar?: string | null } | null;
}

interface Props {
    game: GameInfo;
    topPlayers: TopPlayer[];
    recentLfg: RecentLfg[];
    jsonLd: Record<string, unknown>;
}

export default function FindGame({ game, topPlayers, recentLfg, jsonLd }: Props) {
    const { auth } = usePage<PageProps>().props;
    const isAuthed = !!auth?.user;
    const cover = gameCoverUrl(game.cover_image, 'hero') || `/images/games/${game.slug}.svg`;

    const content = (
        <>
            <SeoHead />
            <Head>
                <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
            </Head>

            {/* Hero — title carries the long-tail keyword for crawlers */}
            <div className="relative h-72 overflow-hidden bg-ink-900 sm:h-96">
                <img
                    src={cover}
                    alt={game.name}
                    decoding="async"
                    fetchPriority="high"
                    className="h-full w-full object-cover opacity-65"
                    onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.fallback) {
                            img.dataset.fallback = '1';
                            img.src = '/icons/icon-512.png';
                        }
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bone-50 via-ink-900/40 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
                    <div className="text-xs font-semibold uppercase tracking-widest text-white/80">
                        SquadSpawn · Find your squad
                    </div>
                    <h1 className="mt-2 text-3xl font-black text-white drop-shadow-md sm:text-5xl">
                        Find {game.name} Teammates
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm font-medium text-white/90 drop-shadow sm:text-base">
                        {game.players_count > 0
                            ? `${game.players_count.toLocaleString()} verified ${game.name} players are squadding up on SquadSpawn — rate teammates, build reputation, play with people who actually show up.`
                            : `Be the first to claim a ${game.name} squad on SquadSpawn — verified gamers, real reputation, no toxicity tax.`}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        {!isAuthed && (
                            <Link href={route('register')} className="inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-neon-red/30 transition hover:bg-neon-red/85">
                                Join SquadSpawn — free
                            </Link>
                        )}
                        {isAuthed && (
                            <Link href={route('lfg.create')} className="inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-neon-red/30 transition hover:bg-neon-red/85">
                                Post a {game.name} LFG
                            </Link>
                        )}
                        <Link href={route('games.show', game.slug)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20">
                            About {game.name}
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                {/* Stats strip — only render the player/LFG cells when we
                    actually have something to brag about. "0 players · 0
                    LFGs" undermines the "be the first" cold-start framing. */}
                {(game.players_count > 0 || recentLfg.length > 0 || game.genre || (game.platforms && game.platforms.length > 0)) && (
                    <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {game.players_count > 0 && (
                            <div className="rounded-xl border border-ink-900/10 bg-white p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Players</div>
                                <div className="mt-1 text-2xl font-black text-ink-900">{game.players_count.toLocaleString()}</div>
                            </div>
                        )}
                        {recentLfg.length > 0 && (
                            <div className="rounded-xl border border-ink-900/10 bg-white p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Open LFGs</div>
                                <div className="mt-1 text-2xl font-black text-neon-red">{recentLfg.length}</div>
                            </div>
                        )}
                        {game.genre && (
                            <div className="rounded-xl border border-ink-900/10 bg-white p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Genre</div>
                                <div className="mt-1 truncate text-base font-bold text-ink-900">{game.genre}</div>
                            </div>
                        )}
                        {game.platforms && game.platforms.length > 0 && (
                            <div className="rounded-xl border border-ink-900/10 bg-white p-4">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Platforms</div>
                                <div className="mt-1 truncate text-base font-bold text-ink-900">{game.platforms.length}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Be-the-first card when both lists are empty. Avoids the
                    page jumping straight from hero to the generic "Why
                    SquadSpawn" block — gives Google more on-topic words
                    to chew on AND gives the visitor a clear next step. */}
                {topPlayers.length === 0 && recentLfg.length === 0 && (
                    <div className="mb-10 rounded-2xl border border-neon-red/30 bg-gradient-to-br from-neon-red/10 via-neon-red/5 to-transparent p-6 text-center sm:p-8">
                        <h2 className="text-xl font-bold text-ink-900">Be the first {game.name} squad on SquadSpawn</h2>
                        <p className="mt-2 text-sm text-ink-500">No-one's posted a {game.name} LFG here yet — that's a free founder slot for whoever moves first. Permanent badge, real reputation, no toxicity tax.</p>
                        {!isAuthed ? (
                            <Link href={route('register')} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-neon-red/30 transition hover:bg-neon-red/85">
                                Claim the founder slot →
                            </Link>
                        ) : (
                            <Link href={route('lfg.create')} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-neon-red/30 transition hover:bg-neon-red/85">
                                Post the first {game.name} LFG →
                            </Link>
                        )}
                    </div>
                )}

                {/* Top players — gives the page real, indexable content */}
                {topPlayers.length > 0 && (
                    <section className="mb-12">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-ink-900">Top {game.name} players on SquadSpawn</h2>
                            {isAuthed && (
                                <Link href={`${route('discovery.index')}?game=${game.slug}`} className="text-sm font-semibold text-neon-red hover:underline">
                                    Match me with players →
                                </Link>
                            )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {topPlayers.map((p) => (
                                <Link
                                    key={p.id}
                                    href={p.username ? `/player/${p.username}` : '#'}
                                    className="group flex items-center gap-3 rounded-xl border border-ink-900/10 bg-white p-4 transition hover:border-neon-red/40 hover:shadow-lg hover:shadow-neon-red/10"
                                >
                                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-neon-red/20">
                                        {p.avatar ? (
                                            <img src={p.avatar} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-base font-bold text-neon-red">
                                                {(p.username || p.name).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {p.is_live && (
                                            <span className="absolute -bottom-0.5 right-0 rounded-full bg-gaming-green px-1.5 text-[8px] font-bold text-white shadow ring-2 ring-white">LIVE</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-bold text-ink-900 group-hover:text-neon-red">
                                            {p.username || p.name}
                                        </div>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
                                            {p.reputation_score != null && p.reputation_score > 0 && (
                                                <span className="font-bold text-yellow-500">★ {Number(p.reputation_score).toFixed(1)}</span>
                                            )}
                                            {p.region && <span>{p.region}</span>}
                                            {p.has_mic && <span className="rounded-full bg-gaming-cyan/10 px-1.5 py-0.5 font-semibold text-gaming-cyan">mic</span>}
                                            {p.looking_for && p.looking_for !== 'any' && (
                                                <span className="rounded-full bg-ink-900/5 px-1.5 py-0.5">{p.looking_for}</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recent LFGs */}
                {recentLfg.length > 0 && (
                    <section className="mb-12">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-ink-900">Open {game.name} LFGs right now</h2>
                            <Link href={route('lfg.index')} className="text-sm font-semibold text-neon-red hover:underline">
                                Browse all LFGs →
                            </Link>
                        </div>
                        <div className="space-y-3">
                            {recentLfg.map((lfg) => (
                                <Link
                                    key={lfg.slug}
                                    href={route('lfg.show', { lfgPost: lfg.slug })}
                                    className="group flex flex-wrap items-center gap-4 rounded-xl border border-ink-900/10 bg-white p-4 transition hover:border-neon-red/40 hover:shadow-lg hover:shadow-neon-red/10"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-neon-red/20">
                                            {lfg.user?.avatar ? (
                                                <img src={lfg.user.avatar} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-neon-red">
                                                    {(lfg.user?.username ?? '?').charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-sm font-bold text-ink-900 group-hover:text-neon-red">{lfg.title}</div>
                                            <div className="mt-0.5 text-[11px] text-ink-500">
                                                {lfg.user?.username ?? 'someone'} · {lfg.platform.toUpperCase()} · {lfg.created_at_human}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-gaming-green/10 px-2.5 py-1 text-xs font-bold text-gaming-green">
                                        {lfg.spots_filled}/{lfg.spots_needed} filled
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Why SquadSpawn — keyword-rich body copy for SEO. */}
                <section className="mb-12 rounded-2xl border border-ink-900/10 bg-white p-6 sm:p-8">
                    <h2 className="text-xl font-bold text-ink-900">Why squad up on SquadSpawn?</h2>
                    <div className="mt-4 grid gap-6 sm:grid-cols-3">
                        <div>
                            <div className="text-sm font-bold text-neon-red">Verified, not random</div>
                            <p className="mt-1 text-xs text-ink-500">Every {game.name} player has a profile, a reputation score, and rated history — no anonymous one-shot teammates.</p>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gaming-green">Reputation that follows you</div>
                            <p className="mt-1 text-xs text-ink-500">Toxic players get rated out, dependable squads rise. Your stars are earned per-session, not bought.</p>
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gaming-cyan">LFG, scheduled or now</div>
                            <p className="mt-1 text-xs text-ink-500">Post a {game.name} LFG, fill open spots, jump into voice — friendships, not random fills.</p>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                {!isAuthed && (
                    <div className="rounded-2xl border border-neon-red/30 bg-gradient-to-br from-neon-red/15 via-neon-red/5 to-transparent p-8 text-center">
                        <h2 className="text-2xl font-bold text-ink-900">Ready to find your {game.name} squad?</h2>
                        <p className="mt-2 text-sm text-ink-500">Join SquadSpawn — free forever, AVG-compliant, built in NL.</p>
                        <Link href={route('register')} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-lg shadow-neon-red/30 transition hover:bg-neon-red/85">
                            Create your free profile →
                        </Link>
                    </div>
                )}
            </div>
        </>
    );

    if (isAuthed) {
        return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
    }
    return <div className="min-h-screen bg-bone-50">{content}</div>;
}
