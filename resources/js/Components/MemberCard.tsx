import FavoriteHostButton from '@/Components/FavoriteHostButton';
import HostTrustRow from '@/Components/HostTrustRow';
import { Link } from '@inertiajs/react';
import type { User } from '@/types';

export interface MemberStats {
    sessions_hosted: number;
    rating_count: number;
    is_online: boolean;
    hours_since_active?: number | null;
    is_favorited?: boolean;
    is_friend?: boolean;
    shared_game_ids?: number[];
    shared_game_names?: string[];
    games?: { id: number; name: string; slug: string }[];
}

interface Props {
    member: User;
    stats?: MemberStats;
    roleBadge?: string;
    onClose: () => void;
    isSelf?: boolean;
}

export default function MemberCard({ member, stats, roleBadge, onClose, isSelf = false }: Props) {
    const profileUrl = member.profile?.username ? `/player/${member.profile.username}` : null;
    const shared = stats?.shared_game_names ?? [];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-t-2xl border border-ink-900/10 bg-white p-6 shadow-xl sm:rounded-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex-1">
                        <HostTrustRow host={member} stats={stats} size="md" />
                    </div>
                    {roleBadge && (
                        <span className="shrink-0 rounded-full bg-neon-red/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon-red">
                            {roleBadge}
                        </span>
                    )}
                </div>

                {shared.length > 0 && (
                    <div className="mb-4 rounded-lg border border-gaming-cyan/30 bg-gaming-cyan/5 p-3">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gaming-cyan">
                            You both play
                        </div>
                        <div className="text-sm font-semibold text-ink-900">
                            {shared.slice(0, 4).join(' · ')}
                            {shared.length > 4 && <span className="font-normal text-ink-500"> +{shared.length - 4} more</span>}
                        </div>
                    </div>
                )}

                {stats?.games && stats.games.length > 0 && shared.length === 0 && (
                    <div className="mb-4">
                        <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ink-500">
                            Plays
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {stats.games.map((g) => (
                                <span key={g.id} className="rounded-full bg-bone-100 px-2 py-0.5 text-xs font-medium text-ink-700">
                                    {g.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    {profileUrl && (
                        <Link
                            href={profileUrl}
                            className="block w-full rounded-xl bg-neon-red px-4 py-2.5 text-center text-sm font-bold text-white transition hover:bg-neon-red/80"
                        >
                            View full profile
                        </Link>
                    )}
                    {!isSelf && (
                        <FavoriteHostButton
                            hostId={member.id}
                            initialFavorited={stats?.is_favorited ?? false}
                            className="w-full justify-center"
                        />
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="block w-full rounded-xl border border-ink-900/10 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-bone-100"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
