import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, Profile } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const REGIONS = [
    'Philippines',
    'Indonesia',
    'Malaysia',
    'Singapore',
    'Thailand',
    'Vietnam',
    'Myanmar',
    'Cambodia',
    'Laos',
    'Brunei',
    'Other - Asia',
    'Other - Global',
];

const TIMEZONES = [
    'Asia/Manila',
    'Asia/Jakarta',
    'Asia/Kuala_Lumpur',
    'Asia/Singapore',
    'Asia/Bangkok',
    'Asia/Ho_Chi_Minh',
    'Asia/Yangon',
    'Asia/Phnom_Penh',
    'Asia/Vientiane',
    'Asia/Brunei',
    'UTC',
];

const LOOKING_FOR_OPTIONS = [
    { value: 'casual', label: 'Casual Play' },
    { value: 'ranked', label: 'Ranked / Competitive' },
    { value: 'friends', label: 'Just Friends' },
    { value: 'any', label: 'Open to Anything' },
];

export default function GameProfileEdit({
    profile,
    games,
    userGames,
}: {
    profile: Profile | null;
    games: Game[];
    userGames: Game[];
}) {
    const userGameIds = userGames.map((g) => g.id);

    const { data, setData, put, processing, errors } = useForm<{
        username: string;
        bio: string;
        looking_for: string;
        region: string;
        timezone: string;
        games: Record<number, { selected: boolean; rank: string; platform: string }>;
    }>({
        username: profile?.username ?? '',
        bio: profile?.bio ?? '',
        looking_for: profile?.looking_for ?? 'any',
        region: profile?.region ?? '',
        timezone: profile?.timezone ?? '',
        games: games.reduce(
            (acc, game) => {
                const userGame = userGames.find((ug) => ug.id === game.id);
                acc[game.id] = {
                    selected: userGameIds.includes(game.id),
                    rank: userGame?.pivot?.rank ?? '',
                    platform: userGame?.pivot?.platform ?? (game.platforms[0] ?? ''),
                };
                return acc;
            },
            {} as Record<number, { selected: boolean; rank: string; platform: string }>,
        ),
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('game-profile.update'));
    };

    const toggleGame = (gameId: number) => {
        setData('games', {
            ...data.games,
            [gameId]: {
                ...data.games[gameId],
                selected: !data.games[gameId].selected,
            },
        });
    };

    const updateGameField = (
        gameId: number,
        field: 'rank' | 'platform',
        value: string,
    ) => {
        setData('games', {
            ...data.games,
            [gameId]: {
                ...data.games[gameId],
                [field]: value,
            },
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-white">
                    Gaming Profile
                </h2>
            }
        >
            <Head title="Gaming Profile" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <form onSubmit={submit} className="space-y-8">
                        {/* Basic Info */}
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                            <h3 className="mb-6 text-lg font-semibold text-white">
                                Basic Info
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-300">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        className="w-full rounded-lg border border-white/10 bg-navy-700 px-4 py-2 text-white placeholder-gray-500 focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                        placeholder="Your gaming username"
                                    />
                                    {errors.username && (
                                        <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-300">
                                        Bio
                                    </label>
                                    <textarea
                                        value={data.bio}
                                        onChange={(e) => setData('bio', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-white/10 bg-navy-700 px-4 py-2 text-white placeholder-gray-500 focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                        placeholder="Tell others about your playstyle..."
                                    />
                                    {errors.bio && (
                                        <p className="mt-1 text-sm text-red-400">{errors.bio}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-300">
                                        Looking For
                                    </label>
                                    <select
                                        value={data.looking_for}
                                        onChange={(e) => setData('looking_for', e.target.value)}
                                        className="w-full rounded-lg border border-white/10 bg-navy-700 px-4 py-2 text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                    >
                                        {LOOKING_FOR_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-300">
                                            Region
                                        </label>
                                        <select
                                            value={data.region}
                                            onChange={(e) => setData('region', e.target.value)}
                                            className="w-full rounded-lg border border-white/10 bg-navy-700 px-4 py-2 text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                        >
                                            <option value="">Select region</option>
                                            {REGIONS.map((r) => (
                                                <option key={r} value={r}>
                                                    {r}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-300">
                                            Timezone
                                        </label>
                                        <select
                                            value={data.timezone}
                                            onChange={(e) => setData('timezone', e.target.value)}
                                            className="w-full rounded-lg border border-white/10 bg-navy-700 px-4 py-2 text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                        >
                                            <option value="">Select timezone</option>
                                            {TIMEZONES.map((tz) => (
                                                <option key={tz} value={tz}>
                                                    {tz}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Games */}
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                            <h3 className="mb-6 text-lg font-semibold text-white">
                                Your Games
                            </h3>

                            <div className="space-y-4">
                                {games.map((game) => {
                                    const gameData = data.games[game.id];
                                    if (!gameData) return null;

                                    return (
                                        <div
                                            key={game.id}
                                            className={`rounded-lg border p-4 transition ${
                                                gameData.selected
                                                    ? 'border-gaming-purple/50 bg-gaming-purple/5'
                                                    : 'border-white/10 bg-navy-700'
                                            }`}
                                        >
                                            <label className="flex cursor-pointer items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={gameData.selected}
                                                    onChange={() => toggleGame(game.id)}
                                                    className="h-5 w-5 rounded border-white/20 bg-navy-700 text-gaming-purple focus:ring-gaming-purple"
                                                />
                                                <span className="font-medium text-white">
                                                    {game.name}
                                                </span>
                                                <span className="text-sm text-gray-400">
                                                    {game.genre}
                                                </span>
                                            </label>

                                            {gameData.selected && (
                                                <div className="mt-4 grid gap-4 pl-8 sm:grid-cols-2">
                                                    {game.rank_system && game.rank_system.length > 0 && (
                                                        <div>
                                                            <label className="mb-1 block text-xs font-medium text-gray-400">
                                                                Rank
                                                            </label>
                                                            <select
                                                                value={gameData.rank}
                                                                onChange={(e) =>
                                                                    updateGameField(
                                                                        game.id,
                                                                        'rank',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                className="w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-1.5 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                                            >
                                                                <option value="">Select rank</option>
                                                                {game.rank_system.map((rank) => (
                                                                    <option key={rank} value={rank}>
                                                                        {rank}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    <div>
                                                        <label className="mb-1 block text-xs font-medium text-gray-400">
                                                            Platform
                                                        </label>
                                                        <select
                                                            value={gameData.platform}
                                                            onChange={(e) =>
                                                                updateGameField(
                                                                    game.id,
                                                                    'platform',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            className="w-full rounded-lg border border-white/10 bg-navy-900 px-3 py-1.5 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                                        >
                                                            {game.platforms.map((p) => (
                                                                <option key={p} value={p}>
                                                                    {p}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-gaming-purple px-6 py-3 font-semibold text-white transition hover:bg-gaming-purple/80 disabled:opacity-50 sm:w-auto"
                        >
                            {processing ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
