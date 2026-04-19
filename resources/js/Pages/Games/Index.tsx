import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

interface GameWithCount extends Game {
    users_count: number;
}

const PLATFORM_LABELS: Record<string, string> = {
    pc: 'PC',
    playstation: 'PlayStation',
    xbox: 'Xbox',
    nintendo: 'Switch',
    mac: 'Mac',
    linux: 'Linux',
    ios: 'iOS',
    android: 'Android',
    mobile: 'Mobile',
    web: 'Web',
};

function prettyPlatform(p: string): string {
    const key = p.toLowerCase();
    return PLATFORM_LABELS[key] ?? p.charAt(0).toUpperCase() + p.slice(1);
}

export default function GamesIndex({ games }: { games: GameWithCount[] }) {
    const { auth } = usePage<PageProps>().props;

    const content = (
        <>
            <Head title="Games" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-ink-900">Games</h1>
                        <p className="mt-2 text-ink-500">
                            {games.length} games available · Find players for your favourite titles
                        </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {games.map((game) => (
                            <Link
                                key={game.id}
                                href={auth?.user ? route('discovery.index', { game_id: game.id }) : route('register')}
                                className="group flex flex-col overflow-hidden rounded-xl border border-ink-900/10 bg-white transition hover:-translate-y-0.5 hover:border-neon-red/40 hover:shadow-lg hover:shadow-neon-red/15"
                            >
                                {/* Cover */}
                                <div className="relative aspect-[16/10] overflow-hidden bg-ink-900">
                                    <img
                                        src={game.cover_image || `/images/games/${game.slug}.svg`}
                                        alt={game.name}
                                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink-900/80 to-transparent" />

                                    {/* Player count — readable on any cover */}
                                    <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-ink-900/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                                        <span className="h-1.5 w-1.5 rounded-full bg-gaming-green" />
                                        {game.users_count.toLocaleString()} {game.users_count === 1 ? 'player' : 'players'}
                                    </div>

                                    {/* Genre overlaid on cover bottom */}
                                    <div className="absolute bottom-3 left-3">
                                        <span className="rounded-md bg-neon-red px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                                            {game.genre}
                                        </span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="text-lg font-bold leading-tight text-ink-900 group-hover:text-neon-red">
                                        {game.name}
                                    </h3>

                                    {game.description && (
                                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
                                            {game.description}
                                        </p>
                                    )}

                                    {/* Platforms */}
                                    {game.platforms && game.platforms.length > 0 && (
                                        <div className="mt-3">
                                            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-ink-500">Platforms</div>
                                            <div className="flex flex-wrap gap-1">
                                                {game.platforms.map((p) => (
                                                    <span
                                                        key={p}
                                                        className="rounded-md border border-ink-900/10 bg-bone-50 px-2 py-0.5 text-[10px] font-semibold text-ink-700"
                                                    >
                                                        {prettyPlatform(p)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Ranks */}
                                    {game.rank_system && game.rank_system.length > 0 && (
                                        <div className="mt-3">
                                            <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-ink-500">Ranks</div>
                                            <div className="flex flex-wrap gap-1">
                                                {game.rank_system.slice(0, 4).map((rank) => (
                                                    <span
                                                        key={rank}
                                                        className="rounded-md bg-ink-900/5 px-2 py-0.5 text-[10px] font-medium text-ink-700"
                                                    >
                                                        {rank}
                                                    </span>
                                                ))}
                                                {game.rank_system.length > 4 && (
                                                    <span className="rounded-md bg-ink-900/5 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                                                        +{game.rank_system.length - 4} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto pt-4">
                                        <span className="block rounded-lg bg-neon-red/10 py-2 text-center text-xs font-bold text-neon-red transition group-hover:bg-neon-red group-hover:text-white">
                                            {auth?.user ? 'Find Players' : 'Join to Play'} →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );

    if (auth?.user) {
        return <AuthenticatedLayout>{content}</AuthenticatedLayout>;
    }

    return <div className="min-h-screen bg-bone-50">{content}</div>;
}
