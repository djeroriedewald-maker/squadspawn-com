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
        is_creator: boolean;
        stream_url: string;
        socials: Record<string, string>;
        games: Record<number, { selected: boolean; rank: string; role: string; platform: string }>;
    }>({
        username: profile?.username ?? '',
        bio: profile?.bio ?? '',
        looking_for: profile?.looking_for ?? 'any',
        region: profile?.region ?? '',
        timezone: profile?.timezone ?? '',
        is_creator: profile?.is_creator ?? false,
        stream_url: profile?.stream_url ?? '',
        socials: {
            discord: profile?.socials?.discord ?? '',
            instagram: profile?.socials?.instagram ?? '',
            twitter: profile?.socials?.twitter ?? '',
            tiktok: profile?.socials?.tiktok ?? '',
            youtube: profile?.socials?.youtube ?? '',
            twitch: profile?.socials?.twitch ?? '',
            facebook: profile?.socials?.facebook ?? '',
        },
        games: games.reduce(
            (acc, game) => {
                const userGame = userGames.find((ug) => ug.id === game.id);
                acc[game.id] = {
                    selected: userGameIds.includes(game.id),
                    rank: userGame?.pivot?.rank ?? '',
                    role: userGame?.pivot?.role ?? '',
                    platform: userGame?.pivot?.platform ?? (game.platforms[0] ?? ''),
                };
                return acc;
            },
            {} as Record<number, { selected: boolean; rank: string; role: string; platform: string }>,
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
                role: g.role,
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
        field: 'rank' | 'role' | 'platform',
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

                        {/* Socials */}
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                            <h3 className="mb-2 text-lg font-semibold text-white">Socials</h3>
                            <p className="mb-5 text-sm text-gray-400">Link your socials so friends can connect with you outside SquadSpawn.</p>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { key: 'discord', label: 'Discord', placeholder: 'username or https://discord.gg/your-server', color: 'text-[#5865F2]', icon: 'M20.317 4.3698a19.791 19.791 0 00-4.885-1.5152.0729.0729 0 00-.0785.0378c-.2107.3748-.4443.8632-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1641-.3933-.4058-.8747-.6177-1.2495a.077.077 0 00-.0785-.0378 19.736 19.736 0 00-4.8852 1.5152.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.299 12.299 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z' },
                                    { key: 'instagram', label: 'Instagram', placeholder: '@username', color: 'text-[#E4405F]', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                                    { key: 'twitter', label: 'X (Twitter)', placeholder: '@username', color: 'text-white', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                                    { key: 'tiktok', label: 'TikTok', placeholder: '@username', color: 'text-white', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
                                    { key: 'youtube', label: 'YouTube', placeholder: 'channel URL or @handle', color: 'text-[#FF0000]', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                                    { key: 'twitch', label: 'Twitch', placeholder: 'username', color: 'text-[#9146FF]', icon: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z' },
                                    { key: 'facebook', label: 'Facebook', placeholder: 'profile URL', color: 'text-[#1877F2]', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                                ].map((social) => (
                                    <div key={social.key} className="flex items-center gap-2 rounded-lg border border-white/10 bg-navy-700 px-3 py-2">
                                        <svg className={`h-4 w-4 shrink-0 ${social.color}`} fill="currentColor" viewBox="0 0 24 24"><path d={social.icon} /></svg>
                                        <input
                                            type="text"
                                            value={data.socials[social.key] || ''}
                                            onChange={(e) => setData('socials', { ...data.socials, [social.key]: e.target.value })}
                                            placeholder={social.placeholder}
                                            className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Creator Settings */}
                        <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                            <h3 className="mb-2 text-lg font-semibold text-white">Creator Settings</h3>
                            <p className="mb-5 text-sm text-gray-400">Enable creator features to showcase your content and streams.</p>

                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.is_creator}
                                    onChange={(e) => setData('is_creator', e.target.checked)}
                                    className="h-5 w-5 rounded border-white/10 bg-navy-700 text-gaming-purple focus:ring-gaming-purple focus:ring-offset-0"
                                />
                                <span className="text-sm font-medium text-white">I'm a Content Creator</span>
                            </label>

                            {data.is_creator && (
                                <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-gray-300">
                                            Stream URL
                                        </label>
                                        <input
                                            type="url"
                                            value={data.stream_url}
                                            onChange={(e) => setData('stream_url', e.target.value)}
                                            placeholder="https://twitch.tv/yourchannel or https://youtube.com/@yourchannel"
                                            className="w-full rounded-lg border border-white/10 bg-navy-700 px-4 py-2 text-white placeholder-gray-500 focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                        />
                                        {errors.stream_url && (
                                            <p className="mt-1 text-sm text-red-400">{errors.stream_url}</p>
                                        )}
                                        <p className="mt-1 text-xs text-gray-500">Your Twitch or YouTube channel URL</p>
                                    </div>
                                </div>
                            )}
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
                                                        {game.roles && game.roles.length > 0 && (
                                                            <select
                                                                value={gameData.role}
                                                                onChange={(e) => updateGameField(game.id, 'role', e.target.value)}
                                                                className="w-full rounded-md border border-white/10 bg-navy-800 px-2 py-1.5 text-xs text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                                            >
                                                                <option value="">Select role</option>
                                                                {game.roles.map((role) => (
                                                                    <option key={role} value={role}>{role}</option>
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
