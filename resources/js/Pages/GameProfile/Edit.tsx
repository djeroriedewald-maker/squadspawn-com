import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, Profile } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

const PRESET_AVATARS = [
    'warrior', 'mage', 'healer', 'tank', 'assassin', 'ranger',
    'dragon', 'wolf', 'phoenix', 'ghost', 'robot', 'ninja',
];

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
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar || '');
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('File must be under 2MB');
            return;
        }

        setAvatarUploading(true);
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await axios.post(route('avatar.upload'), formData);
            setAvatarUrl(res.data.url);
        } catch (err: any) {
            const msg = err.response?.data?.errors?.avatar?.[0] || 'Upload failed';
            alert(msg);
        }
        setAvatarUploading(false);
    };

    const selectPreset = async (preset: string) => {
        try {
            const res = await axios.post(route('avatar.preset'), { preset });
            setAvatarUrl(res.data.url);
            setShowPresets(false);
        } catch {
            alert('Failed to set avatar');
        }
    };

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
                        {/* Avatar */}
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                            <h3 className="mb-6 text-lg font-semibold text-white">Avatar</h3>
                            <div className="flex flex-col items-center gap-6 sm:flex-row">
                                {/* Current avatar */}
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-white">
                                            {profile?.username?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col gap-3">
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={avatarUploading}
                                            className="rounded-lg bg-gaming-purple px-4 py-2 text-sm font-medium text-white transition hover:bg-gaming-purple/80 disabled:opacity-50"
                                        >
                                            {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPresets(!showPresets)}
                                            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:bg-navy-700 hover:text-white"
                                        >
                                            Choose Avatar
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleAvatarUpload}
                                            className="hidden"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">JPG, PNG or WebP. Max 2MB.</p>
                                </div>
                            </div>

                            {/* Preset grid */}
                            {showPresets && (
                                <div className="mt-6 border-t border-white/10 pt-6">
                                    <p className="mb-3 text-sm font-medium text-gray-300">Choose a preset avatar</p>
                                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                        {PRESET_AVATARS.map((name) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => selectPreset(name)}
                                                className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition hover:border-gaming-purple/50 hover:bg-navy-700 ${
                                                    avatarUrl === `/images/avatars/${name}.svg`
                                                        ? 'border-gaming-purple bg-gaming-purple/10'
                                                        : 'border-white/10'
                                                }`}
                                            >
                                                <img
                                                    src={`/images/avatars/${name}.svg`}
                                                    alt={name}
                                                    className="h-12 w-12 rounded-full"
                                                />
                                                <span className="text-[10px] capitalize text-gray-400">{name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

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
