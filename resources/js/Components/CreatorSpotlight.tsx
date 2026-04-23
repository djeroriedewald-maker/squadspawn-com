import { Link } from '@inertiajs/react';

interface Clip {
    id: number;
    title: string;
    url: string;
    platform: string;
    thumbnail?: string | null;
}

interface Game {
    id: number;
    name: string;
    slug: string;
    cover_image?: string | null;
}

export interface FeaturedCreator {
    id: number;
    username: string | null;
    avatar?: string | null;
    bio?: string | null;
    reputation_score?: number | string | null;
    is_live: boolean;
    socials?: Record<string, string | null> | null;
    games: Game[];
    top_clip: Clip | null;
    clip_count: number;
}

interface Props {
    creators: FeaturedCreator[];
    heading?: string;
    subheading?: string;
    variant?: 'light' | 'dark';
}

const SOCIAL_LABELS: Record<string, string> = {
    twitch: 'Twitch',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    twitter: 'X',
    instagram: 'Instagram',
    discord: 'Discord',
};

function platformBadge(platform: string): string {
    if (platform === 'youtube') return '▶ YouTube';
    if (platform === 'twitch') return '🎮 Twitch';
    if (platform === 'tiktok') return '♪ TikTok';
    return platform;
}

function socialUrl(key: string, value: string): string {
    if (value.startsWith('http')) return value;
    const stripped = value.replace(/^@/, '');
    switch (key) {
        case 'twitch': return `https://twitch.tv/${stripped}`;
        case 'youtube': return `https://youtube.com/${stripped}`;
        case 'tiktok': return `https://tiktok.com/@${stripped}`;
        case 'twitter': return `https://x.com/${stripped}`;
        case 'instagram': return `https://instagram.com/${stripped}`;
        default: return value;
    }
}

export default function CreatorSpotlight({
    creators,
    heading = 'Creator Spotlight',
    subheading = 'Gamers and streamers worth following on SquadSpawn this week.',
}: Props) {
    if (!creators || creators.length === 0) return null;

    return (
        <section className="mb-8">
            <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-gaming-orange">✨</span>
                        <h2 className="text-lg font-bold text-ink-900">{heading}</h2>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-500">{subheading}</p>
                </div>
                <Link href="/clips" className="text-sm text-neon-red hover:text-neon-red/80">
                    All clips →
                </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {creators.map((c) => (
                    <CreatorCard key={c.id} creator={c} />
                ))}
            </div>
        </section>
    );
}

function CreatorCard({ creator }: { creator: FeaturedCreator }) {
    const rep = creator.reputation_score != null ? Number(creator.reputation_score) : 0;
    const activeSocials = creator.socials
        ? Object.entries(creator.socials).filter(([, v]) => v && String(v).trim() !== '')
        : [];

    return (
        <article className="group overflow-hidden rounded-2xl border border-ink-900/10 bg-white transition hover:border-gaming-orange/40 hover:shadow-lg hover:shadow-gaming-orange/10 dark:bg-bone-100">
            {/* Top clip thumbnail */}
            <Link
                href={`/player/${creator.username ?? ''}`}
                className="relative block aspect-video overflow-hidden bg-ink-900"
            >
                {creator.top_clip?.thumbnail ? (
                    <img
                        src={creator.top_clip.thumbnail}
                        alt={creator.top_clip.title}
                        className="h-full w-full object-cover opacity-90 transition group-hover:scale-105 group-hover:opacity-100"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon-red/20 to-gaming-pink/20 text-4xl">
                        🎬
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute left-2 top-2 flex items-center gap-1.5">
                    <span className="rounded-full bg-gaming-orange px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">
                        ✨ Featured
                    </span>
                    {creator.is_live && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            ● Live
                        </span>
                    )}
                </div>
                {creator.top_clip && (
                    <div className="absolute bottom-2 left-2 right-2">
                        <p className="line-clamp-1 text-xs font-medium text-white drop-shadow-lg">
                            {creator.top_clip.title}
                        </p>
                        <p className="text-[10px] text-white/70">
                            {platformBadge(creator.top_clip.platform)} · {creator.clip_count} clip{creator.clip_count === 1 ? '' : 's'}
                        </p>
                    </div>
                )}
            </Link>

            {/* Creator info */}
            <div className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20 text-sm font-bold text-neon-red">
                        {creator.avatar ? (
                            <img src={creator.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                            (creator.username ?? '?').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/player/${creator.username ?? ''}`}
                            className="block truncate font-semibold text-ink-900 hover:text-neon-red"
                        >
                            {creator.username ?? 'Creator'}
                        </Link>
                        {rep > 0 && (
                            <p className="text-[11px] text-ink-500">
                                <span className="text-yellow-400">★</span> {rep.toFixed(1)}
                            </p>
                        )}
                    </div>
                </div>

                {creator.bio && (
                    <p className="mt-2 line-clamp-2 text-xs text-ink-500">{creator.bio}</p>
                )}

                {/* Games */}
                {creator.games.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                        {creator.games.map((g) => (
                            <span
                                key={g.id}
                                className="rounded-full bg-ink-900/5 px-2 py-0.5 text-[10px] font-medium text-ink-700"
                            >
                                {g.name.split(':')[0].split(' ').slice(0, 2).join(' ')}
                            </span>
                        ))}
                    </div>
                )}

                {/* Socials */}
                {activeSocials.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-ink-900/5 pt-3">
                        {activeSocials.map(([key, value]) => (
                            <a
                                key={key}
                                href={socialUrl(key, String(value))}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md bg-gaming-pink/10 px-2 py-1 text-[10px] font-medium text-gaming-pink transition hover:bg-gaming-pink/20"
                            >
                                {SOCIAL_LABELS[key] ?? key}
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </article>
    );
}
