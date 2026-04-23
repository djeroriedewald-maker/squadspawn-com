import GamePicker from '@/Components/GamePicker';
import { BannerPresetThumb, ProfileBanner } from '@/Components/ProfileBanner';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, Profile } from '@/types';
import { BANNER_PRESETS, DEFAULT_PRESET_ID } from '@/utils/bannerPresets';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ChangeEvent, FormEventHandler, useMemo, useRef, useState } from 'react';

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

    const handleBannerUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBannerError(null);

        if (file.size > 3 * 1024 * 1024) {
            setBannerError('File must be under 3 MB.');
            return;
        }

        setBannerUploading(true);
        const form = new FormData();
        form.append('banner', file);
        try {
            const res = await axios.post(route('banner.upload'), form);
            setBannerUploadPath(res.data.path);
            setData('banner_style', 'upload');
        } catch (err: any) {
            const msg = err.response?.data?.errors?.banner?.[0]
                ?? err.response?.data?.message
                ?? 'Upload failed.';
            setBannerError(msg);
        } finally {
            setBannerUploading(false);
            if (bannerInputRef.current) bannerInputRef.current.value = '';
        }
    };

    const removeBannerUpload = async () => {
        if (!bannerUploadPath) return;
        if (!confirm('Remove your uploaded banner?')) return;
        try {
            await axios.delete(route('banner.destroy'));
            setBannerUploadPath(null);
            setData('banner_style', 'game');
        } catch {
            setBannerError('Could not remove banner.');
        }
    };

    // Banner upload state (phase 2). We post the file separately from
    // the main form (same pattern as avatars) and then let the user save
    // the chosen style via the main Save button.
    const [bannerUploadPath, setBannerUploadPath] = useState<string | null>(profile?.banner_upload_path ?? null);
    const [bannerUploading, setBannerUploading] = useState(false);
    const [bannerError, setBannerError] = useState<string | null>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const userLevel = (profile as any)?.level ?? 1;
    const BANNER_MIN_LEVEL = 2;
    const canUploadBanner = userLevel >= BANNER_MIN_LEVEL;

    const { data, setData, put, processing, errors, transform } = useForm<{
        username: string;
        bio: string;
        looking_for: string;
        region: string;
        timezone: string;
        is_creator: boolean;
        has_mic: boolean;
        stream_url: string;
        banner_style: 'game' | 'preset' | 'upload';
        banner_preset: string;
        socials: Record<string, string>;
        // Only keyed by game id for games the user plays. Not keeping an
        // entry for all 1000+ games in the catalogue — wastes memory and
        // makes reconciling a pain.
        games: Record<number, { rank: string; role: string; platform: string }>;
    }>({
        username: profile?.username ?? '',
        bio: profile?.bio ?? '',
        looking_for: profile?.looking_for ?? 'any',
        region: profile?.region ?? '',
        timezone: profile?.timezone ?? '',
        is_creator: profile?.is_creator ?? false,
        has_mic: profile?.has_mic ?? false,
        stream_url: profile?.stream_url ?? '',
        banner_style: (profile?.banner_style as 'game' | 'preset' | 'upload') ?? 'game',
        banner_preset: profile?.banner_preset ?? DEFAULT_PRESET_ID,
        socials: {
            discord: profile?.socials?.discord ?? '',
            instagram: profile?.socials?.instagram ?? '',
            twitter: profile?.socials?.twitter ?? '',
            tiktok: profile?.socials?.tiktok ?? '',
            youtube: profile?.socials?.youtube ?? '',
            twitch: profile?.socials?.twitch ?? '',
            facebook: profile?.socials?.facebook ?? '',
        },
        games: userGames.reduce(
            (acc, ug) => {
                acc[ug.id] = {
                    rank: ug.pivot?.rank ?? '',
                    role: ug.pivot?.role ?? '',
                    platform: ug.pivot?.platform ?? (ug.platforms?.[0] ?? 'any'),
                };
                return acc;
            },
            {} as Record<number, { rank: string; role: string; platform: string }>,
        ),
    });

    // Lookup map so we can render selected games without depending on the
    // full catalogue being present.
    const gameById = useMemo(() => {
        const map = new Map<number, Game>();
        games.forEach((g) => map.set(g.id, g));
        userGames.forEach((ug) => map.set(ug.id, ug));
        return map;
    }, [games, userGames]);

    const selectedGameIds = Object.keys(data.games).map(Number);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const gamesArray = Object.entries(data.games).map(([id, g]) => ({
            game_id: parseInt(id),
            rank: g.rank,
            role: g.role,
            platform: g.platform,
        }));

        // useForm.transform() lets us submit derived games-array while
        // keeping the map-shaped data that the UI edits. Submitting via
        // `put` (not `router.put`) is what binds validation errors back
        // onto this form's `errors` object — otherwise a failed save
        // looked like a silent no-op with no redirect and no feedback.
        transform((current) => ({ ...current, games: gamesArray }));
        put(route('game-profile.update'), {
            preserveScroll: true,
        });
    };

    const addGame = (gameId: number | null) => {
        if (!gameId || data.games[gameId]) return;
        const game = gameById.get(gameId);
        setData('games', {
            ...data.games,
            [gameId]: {
                rank: '',
                role: '',
                platform: game?.platforms?.[0] ?? 'any',
            },
        });
    };

    const removeGame = (gameId: number) => {
        const next = { ...data.games };
        delete next[gameId];
        setData('games', next);
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
                <h2 className="text-xl font-semibold leading-tight text-ink-900">
                    Gaming Profile
                </h2>
            }
        >
            <Head title="Gaming Profile" />

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    {/* Creator Spotlight status — only renders when the creator
                         is actively featured. Gives them lead time to request a
                         renewal before their slot quietly expires. */}
                    {profile?.featured_until && (() => {
                        const ms = new Date(profile.featured_until).getTime() - Date.now();
                        const days = Math.ceil(ms / 86_400_000);
                        if (days <= 0) return null;
                        const expiring = days <= 7;
                        return (
                            <div className={`mb-6 rounded-xl border p-4 ${expiring ? 'border-gaming-orange/30 bg-gaming-orange/10' : 'border-gaming-green/30 bg-gaming-green/10'}`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">✨</span>
                                    <div>
                                        <p className={`text-sm font-semibold ${expiring ? 'text-gaming-orange' : 'text-gaming-green'}`}>
                                            {expiring
                                                ? `Your Creator Spotlight expires in ${days} day${days === 1 ? '' : 's'}`
                                                : `You're in the Creator Spotlight — ${days} days to go`}
                                        </p>
                                        <p className="mt-1 text-xs text-ink-500">
                                            {expiring
                                                ? 'Ping the SquadSpawn team to renew your slot, or keep posting clips to stay visible even after it expires.'
                                                : `Featured through ${new Date(profile.featured_until).toLocaleDateString()}. Your clips show up on the homepage, dashboard and Creators page.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    <form onSubmit={submit} className="space-y-8">
                        {/* Avatar */}
                        <div className="rounded-xl border border-ink-900/10 bg-white p-6">
                            <h3 className="mb-6 text-lg font-semibold text-ink-900">Avatar</h3>
                            <div className="flex flex-col items-center gap-6 sm:flex-row">
                                {/* Current avatar */}
                                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-neon-red to-neon-red-deep">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold text-ink-900">
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
                                            className="rounded-lg bg-neon-red px-4 py-2 text-sm font-medium text-white transition hover:bg-neon-red/80 disabled:opacity-50"
                                        >
                                            {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowPresets(!showPresets)}
                                            className="rounded-lg border border-ink-900/10 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-bone-100 hover:text-ink-900"
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
                                <div className="mt-6 border-t border-ink-900/10 pt-6">
                                    <p className="mb-3 text-sm font-medium text-ink-700">Choose a preset avatar</p>
                                    <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                        {PRESET_AVATARS.map((name) => (
                                            <button
                                                key={name}
                                                type="button"
                                                onClick={() => selectPreset(name)}
                                                className={`flex flex-col items-center gap-1 rounded-xl border p-3 transition hover:border-neon-red/50 hover:bg-bone-100 ${
                                                    avatarUrl === `/images/avatars/${name}.svg`
                                                        ? 'border-neon-red bg-neon-red/10'
                                                        : 'border-ink-900/10'
                                                }`}
                                            >
                                                <img
                                                    src={`/images/avatars/${name}.svg`}
                                                    alt={name}
                                                    className="h-12 w-12 rounded-full"
                                                />
                                                <span className="text-[10px] capitalize text-ink-500">{name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Banner */}
                        <div className="rounded-xl border border-ink-900/10 bg-white p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-ink-900">Profile banner</h3>
                                <span className="rounded-full bg-bone-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                                    Preview
                                </span>
                            </div>

                            {/* Live preview — rebuilds whenever the user flips style/preset */}
                            <div className="mb-5 overflow-hidden rounded-xl border border-ink-900/10">
                                <ProfileBanner
                                    style={data.banner_style}
                                    preset={data.banner_preset}
                                    uploadPath={bannerUploadPath}
                                    mainGame={userGames[0] ?? null}
                                    heightClass="h-28 sm:h-32"
                                >
                                    <div className="flex w-full items-end justify-between gap-3">
                                        <div>
                                            <p className="text-lg font-bold text-white sm:text-2xl">{data.username || 'Your username'}</p>
                                            <p className="text-[11px] text-white/70">This is how it looks on your profile.</p>
                                        </div>
                                    </div>
                                </ProfileBanner>
                            </div>

                            {/* Style switch */}
                            <div className="mb-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => setData('banner_style', 'game')}
                                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                        data.banner_style === 'game'
                                            ? 'bg-neon-red text-white shadow-glow-red'
                                            : 'border border-ink-900/10 bg-bone-100 text-ink-700 hover:border-neon-red/30'
                                    }`}
                                >
                                    Your main game
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('banner_style', 'preset')}
                                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                        data.banner_style === 'preset'
                                            ? 'bg-neon-red text-white shadow-glow-red'
                                            : 'border border-ink-900/10 bg-bone-100 text-ink-700 hover:border-neon-red/30'
                                    }`}
                                >
                                    Gradient preset
                                </button>
                                <button
                                    type="button"
                                    disabled={!canUploadBanner && !bannerUploadPath}
                                    onClick={() => {
                                        if (!bannerUploadPath) {
                                            bannerInputRef.current?.click();
                                        } else {
                                            setData('banner_style', 'upload');
                                        }
                                    }}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                                        data.banner_style === 'upload'
                                            ? 'bg-neon-red text-white shadow-glow-red'
                                            : !canUploadBanner && !bannerUploadPath
                                              ? 'cursor-not-allowed border border-ink-900/10 bg-bone-100/60 text-ink-500'
                                              : 'border border-ink-900/10 bg-bone-100 text-ink-700 hover:border-neon-red/30'
                                    }`}
                                >
                                    {!canUploadBanner && !bannerUploadPath && (
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                    )}
                                    Upload your own
                                </button>
                                <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleBannerUpload}
                                    className="hidden"
                                />
                            </div>

                            {data.banner_style === 'preset' && (
                                <>
                                    <p className="mb-3 text-xs text-ink-500">
                                        Pick one of the presets below — each one keeps the text on top readable in both light and dark mode.
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {BANNER_PRESETS.map((p) => (
                                            <BannerPresetThumb
                                                key={p.id}
                                                preset={p}
                                                active={data.banner_preset === p.id}
                                                onClick={() => setData('banner_preset', p.id)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                            {data.banner_style === 'game' && (
                                <p className="text-xs text-ink-500">
                                    Uses the cover art of the first game in your list, blurred and darkened so your name stays readable.
                                </p>
                            )}
                            {data.banner_style === 'upload' && (
                                <div className="flex flex-wrap items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => bannerInputRef.current?.click()}
                                        disabled={bannerUploading}
                                        className="rounded-lg bg-neon-red px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neon-red/90 disabled:opacity-50"
                                    >
                                        {bannerUploading ? 'Uploading…' : bannerUploadPath ? 'Replace image' : 'Choose file'}
                                    </button>
                                    {bannerUploadPath && (
                                        <button
                                            type="button"
                                            onClick={removeBannerUpload}
                                            className="rounded-lg border border-ink-900/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                                        >
                                            Remove
                                        </button>
                                    )}
                                    <p className="text-xs text-ink-500">JPG / PNG / WebP, max 3 MB, min 1200×300 px.</p>
                                </div>
                            )}
                            {!canUploadBanner && (
                                <p className="mt-3 text-[11px] text-ink-500">
                                    Custom banner upload unlocks at level {BANNER_MIN_LEVEL}. You're currently level {userLevel} — host an LFG or rate teammates to level up.
                                </p>
                            )}
                            {bannerError && (
                                <p className="mt-2 text-xs text-red-500">{bannerError}</p>
                            )}
                        </div>

                        {/* Basic Info */}
                        <div className="rounded-xl border border-ink-900/10 bg-white p-6">
                            <h3 className="mb-6 text-lg font-semibold text-ink-900">
                                Basic Info
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-ink-700">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                        placeholder="Your gaming username"
                                    />
                                    {errors.username && (
                                        <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-ink-700">
                                        Bio
                                    </label>
                                    <textarea
                                        value={data.bio}
                                        onChange={(e) => setData('bio', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                        placeholder="Tell others about your playstyle..."
                                    />
                                    {errors.bio && (
                                        <p className="mt-1 text-sm text-red-400">{errors.bio}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-ink-700">
                                        Looking For
                                    </label>
                                    <select
                                        value={data.looking_for}
                                        onChange={(e) => setData('looking_for', e.target.value)}
                                        className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
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
                                        <label className="mb-1 block text-sm font-medium text-ink-700">
                                            Region
                                        </label>
                                        <select
                                            value={data.region}
                                            onChange={(e) => setData('region', e.target.value)}
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
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
                                        <label className="mb-1 block text-sm font-medium text-ink-700">
                                            Timezone
                                        </label>
                                        <select
                                            value={data.timezone}
                                            onChange={(e) => setData('timezone', e.target.value)}
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
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
                        <div className="rounded-xl border border-ink-900/10 bg-white p-6">
                            <h3 className="mb-2 text-lg font-semibold text-ink-900">Socials</h3>
                            <p className="mb-3 text-sm text-ink-500">Link your socials so friends can connect with you outside SquadSpawn.</p>
                            {data.is_creator && (
                                <div className="mb-4 rounded-lg border border-gaming-orange/30 bg-gaming-orange/5 p-3 text-xs text-ink-700">
                                    <strong className="text-gaming-orange">✨ Creator tip:</strong> linking your YouTube/Twitch here puts a chip on your profile — but to land in <em>Creators &amp; Clips</em> (and get considered for the Spotlight) you also need to share individual clips via the{' '}
                                    <a href={route('clips.index')} className="font-semibold text-neon-red hover:underline">Creators page</a>.
                                </div>
                            )}
                            <div className="grid gap-3 sm:grid-cols-2">
                                {[
                                    { key: 'discord', label: 'Discord', placeholder: 'username or https://discord.gg/your-server', color: 'text-[#5865F2]', icon: 'M20.317 4.3698a19.791 19.791 0 00-4.885-1.5152.0729.0729 0 00-.0785.0378c-.2107.3748-.4443.8632-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1641-.3933-.4058-.8747-.6177-1.2495a.077.077 0 00-.0785-.0378 19.736 19.736 0 00-4.8852 1.5152.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.299 12.299 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z' },
                                    { key: 'instagram', label: 'Instagram', placeholder: '@username', color: 'text-[#E4405F]', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
                                    { key: 'twitter', label: 'X (Twitter)', placeholder: '@username', color: 'text-ink-900', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                                    { key: 'tiktok', label: 'TikTok', placeholder: '@username', color: 'text-ink-900', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
                                    { key: 'youtube', label: 'YouTube', placeholder: 'channel URL or @handle', color: 'text-[#FF0000]', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
                                    { key: 'twitch', label: 'Twitch', placeholder: 'username', color: 'text-[#9146FF]', icon: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z' },
                                    { key: 'facebook', label: 'Facebook', placeholder: 'profile URL', color: 'text-[#1877F2]', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
                                ].map((social) => (
                                    <div key={social.key} className="flex items-center gap-2 rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2">
                                        <svg className={`h-4 w-4 shrink-0 ${social.color}`} fill="currentColor" viewBox="0 0 24 24"><path d={social.icon} /></svg>
                                        <input
                                            type="text"
                                            value={data.socials[social.key] || ''}
                                            onChange={(e) => setData('socials', { ...data.socials, [social.key]: e.target.value })}
                                            placeholder={social.placeholder}
                                            className="w-full border-0 bg-transparent p-0 text-sm text-ink-900 placeholder-gray-500 focus:outline-none focus:ring-0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Setup — voice / creator */}
                        <div className="rounded-xl border border-ink-900/10 bg-white p-6">
                            <h3 className="mb-5 text-lg font-semibold text-ink-900">Setup</h3>

                            <label className="mb-4 flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.has_mic}
                                    onChange={(e) => setData('has_mic', e.target.checked)}
                                    className="h-5 w-5 rounded border-ink-900/10 bg-bone-100 text-neon-red focus:ring-neon-red focus:ring-offset-0"
                                />
                                <span className="text-sm font-medium text-ink-900">🎤 I have a working mic</span>
                            </label>
                            <p className="mb-5 text-xs text-ink-500 pl-8">Shows as a green "Mic ready" badge on your join requests so hosts know voice chat is covered.</p>

                            <label className="flex cursor-pointer items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={data.is_creator}
                                    onChange={(e) => setData('is_creator', e.target.checked)}
                                    className="h-5 w-5 rounded border-ink-900/10 bg-bone-100 text-neon-red focus:ring-neon-red focus:ring-offset-0"
                                />
                                <span className="text-sm font-medium text-ink-900">I'm a Content Creator</span>
                            </label>

                            {data.is_creator && (
                                <div className="mt-5 space-y-4 border-t border-ink-900/10 pt-5">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-ink-700">
                                            Stream URL
                                        </label>
                                        <input
                                            type="url"
                                            value={data.stream_url}
                                            onChange={(e) => setData('stream_url', e.target.value)}
                                            placeholder="https://twitch.tv/yourchannel or https://youtube.com/@yourchannel"
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2 text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
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
                        <div className="rounded-xl border border-ink-900/10 bg-white p-6">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-ink-900">Your Games</h3>
                                <span className="text-sm text-gray-500">
                                    {selectedGameIds.length} {selectedGameIds.length === 1 ? 'game' : 'games'}
                                </span>
                            </div>
                            <p className="mb-4 text-sm text-ink-500">
                                Search for a game to add it to your profile. You can then set your rank, role and platform.
                            </p>

                            {/* Add-a-game picker — excludes games already on the profile */}
                            <div className="mb-6">
                                <GamePicker
                                    games={games.filter((g) => !data.games[g.id])}
                                    value={null}
                                    onChange={(id) => addGame(id)}
                                    placeholder="+ Add a game…"
                                />
                            </div>

                            {selectedGameIds.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-ink-900/15 p-8 text-center text-sm text-ink-500">
                                    No games yet. Use the picker above to add the games you play.
                                </div>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {selectedGameIds.map((id) => {
                                        const game = gameById.get(id);
                                        if (!game) return null;
                                        const gameData = data.games[id];
                                        return (
                                            <div key={id} className="overflow-hidden rounded-xl border border-neon-red/30 ring-1 ring-neon-red/20">
                                                <div className="relative h-24 overflow-hidden">
                                                    <img
                                                        src={game.cover_image || `/images/games/${game.slug}.svg`}
                                                        alt={game.name}
                                                        loading="lazy"
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-bone-50/90 to-transparent" />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeGame(id)}
                                                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900/70 text-white backdrop-blur-sm transition hover:bg-neon-red"
                                                        aria-label={`Remove ${game.name}`}
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <div className="px-3 py-2">
                                                    <p className="text-sm font-semibold text-ink-900">{game.name}</p>
                                                    <p className="text-[10px] text-gray-500">
                                                        {game.genre}
                                                        {game.platforms && game.platforms.length > 0 && ` · ${game.platforms.join(', ')}`}
                                                    </p>
                                                </div>
                                                <div className="border-t border-ink-900/5 bg-bone-50/50 px-3 py-2.5">
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        {game.rank_system && game.rank_system.length > 0 && (
                                                            <select
                                                                value={gameData.rank}
                                                                onChange={(e) => updateGameField(id, 'rank', e.target.value)}
                                                                className="w-full rounded-md border border-ink-900/10 bg-white px-2 py-1.5 text-xs text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
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
                                                                onChange={(e) => updateGameField(id, 'role', e.target.value)}
                                                                className="w-full rounded-md border border-ink-900/10 bg-white px-2 py-1.5 text-xs text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                                            >
                                                                <option value="">Select role</option>
                                                                {game.roles.map((role) => (
                                                                    <option key={role} value={role}>{role}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        {game.platforms && game.platforms.length > 1 && (
                                                            <select
                                                                value={gameData.platform}
                                                                onChange={(e) => updateGameField(id, 'platform', e.target.value)}
                                                                className="w-full rounded-md border border-ink-900/10 bg-white px-2 py-1.5 text-xs text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                                            >
                                                                {game.platforms.map((p) => (
                                                                    <option key={p} value={p}>{p}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-neon-red px-6 py-3 font-semibold text-white transition hover:bg-neon-red/80 disabled:opacity-50 sm:w-auto"
                        >
                            {processing ? 'Saving...' : 'Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
