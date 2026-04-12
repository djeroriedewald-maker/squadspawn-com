import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, Profile } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
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
    'Japan',
    'South Korea',
    'China',
    'India',
    'Netherlands',
    'Germany',
    'United Kingdom',
    'France',
    'Spain',
    'Italy',
    'Poland',
    'United States',
    'Canada',
    'Brazil',
    'Mexico',
    'Australia',
    'Other - Asia',
    'Other - Europe',
    'Other - Americas',
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
        // Transform games record into array format the backend expects
        const gamesArray = Object.entries(data.games)
            .filter(([_, g]) => g.selected)
            .map(([id, g]) => ({
                game_id: parseInt(id),
                rank: g.rank,
                platform: g.platform,
            }));

        router.put(route('game-profile.update'), {
            ...data,
            games: gamesArray,
        }, {
            preserveScroll: true,
        });
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
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Your Games</h3>
                                <span className="text-sm text-gray-500">
                                    {Object.values(data.games).filter((g) => g.selected).length} selected
                                </span>
                            </div>
                            <p className="mb-6 text-sm text-gray-400">Click a game to add it to your profile. Set your rank and platform for each.</p>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {games.map((game) => {
                                    const gameData = data.games[game.id];
                                    if (!gameData) return null;
                                    const isSelected = gameData.selected;

                                    return (
                                        <div
                                            key={game.id}
                                            className={`overflow-hidden rounded-xl border transition ${
                                                isSelected
                                                    ? 'border-gaming-purple ring-1 ring-gaming-purple/50'
                                                    : 'border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            {/* Cover + Toggle */}
                                            <button
                                                type="button"
                                                onClick={() => toggleGame(game.id)}
                                                className="relative w-full"
                                            >
                                                <div className="relative h-24 overflow-hidden">
                                                    <img
                                                        src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                        alt={game.name}
                                                        className={`h-full w-full object-cover transition ${isSelected ? '' : 'grayscale opacity-50'}`}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 to-transparent" />

                                                    {/* Selected badge */}
                                                    {isSelected && (
                                                        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gaming-purple">
                                                            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}

                                                    {/* Not selected overlay */}
                                                    {!isSelected && (
                                                        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/30 bg-black/30">
                                                            <svg className="h-3 w-3 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="px-3 py-2 text-left">
                                                    <p className="text-sm font-semibold text-white">{game.name}</p>
                                                    <p className="text-[10px] text-gray-500">{game.genre} &middot; {game.platforms.join(', ')}</p>
                                                </div>
                                            </button>

                                            {/* Rank & Platform (when selected) */}
                                            {isSelected && (
                                                <div className="border-t border-white/5 bg-navy-900/50 px-3 py-2.5">
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {game.rank_system && game.rank_system.length > 0 && (
                                                            <select
                                                                value={gameData.rank}
                                                                onChange={(e) => updateGameField(game.id, 'rank', e.target.value)}
                                                                className="w-full rounded-md border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                                            >
                                                                <option value="">Select rank</option>
                                                                {game.rank_system.map((rank) => (
                                                                    <option key={rank} value={rank}>{rank}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        {game.platforms.length > 1 && (
                                                            <select
                                                                value={gameData.platform}
                                                                onChange={(e) => updateGameField(game.id, 'platform', e.target.value)}
                                                                className="w-full rounded-md border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                                            >
                                                                {game.platforms.map((p) => (
                                                                    <option key={p} value={p}>{p}</option>
                                                                ))}
                                                            </select>
                                                        )}
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
