import type { User } from '@/types';

export interface HostStats {
    sessions_hosted: number;
    rating_count: number;
    is_online: boolean;
    hours_since_active?: number | null;
    is_favorited?: boolean;
    is_friend?: boolean;
    has_mic?: boolean;
}

interface Props {
    host?: User | null;
    stats?: HostStats | null;
    size?: 'sm' | 'md';
    /** Small inline badges (Favourite / Played before) shown under the name. */
    showRelationshipBadges?: boolean;
}

export default function HostTrustRow({ host, stats, size = 'sm', showRelationshipBadges = true }: Props) {
    if (!host) return null;

    const avatarSize = size === 'md' ? 'h-11 w-11' : 'h-8 w-8';
    const dotSize = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';
    const username = host.profile?.username ?? host.name ?? '?';
    const isAdmin = !!host.is_admin;
    const isMod = !!host.is_moderator;
    // DB stores reputation_score as decimal → may arrive as a string. Coerce
    // defensively so "4.5" and 4.5 both render, and 0 / null / undefined hide.
    const reputationNumber = Number(host.profile?.reputation_score ?? 0);
    const region = host.profile?.region;

    return (
        <div className="flex items-start gap-3">
            <div className={`relative flex ${avatarSize} shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20 text-xs font-bold text-neon-red`}>
                {host.profile?.avatar ? (
                    <img src={host.profile.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                    username.charAt(0).toUpperCase()
                )}
                {stats?.is_online && (
                    <span
                        className={`absolute -bottom-0.5 -right-0.5 ${dotSize} rounded-full border-2 border-white bg-gaming-green shadow-[0_0_6px_rgba(16,185,129,0.8)]`}
                        title="Online now"
                    />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className={`flex flex-wrap items-center gap-1.5 ${size === 'md' ? 'text-base' : 'text-sm'} font-medium text-ink-900`}>
                    <span className="truncate">{username}</span>
                    {isAdmin && (
                        <span className="rounded-full bg-neon-red/20 px-1.5 py-0 text-[9px] font-bold text-neon-red" title="Admin">ADMIN</span>
                    )}
                    {!isAdmin && isMod && (
                        <span className="rounded-full bg-gaming-cyan/20 px-1.5 py-0 text-[9px] font-bold text-gaming-cyan" title="Moderator">MOD</span>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-500">
                    {stats && stats.rating_count > 0 && reputationNumber > 0 ? (
                        <span
                            className="flex items-center gap-0.5 font-semibold text-gaming-orange"
                            title={`${reputationNumber.toFixed(1)} from ${stats.rating_count} rating${stats.rating_count === 1 ? '' : 's'}`}
                        >
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {reputationNumber.toFixed(1)}
                        </span>
                    ) : null}
                    {stats && (
                        <span>
                            {stats.sessions_hosted === 0
                                ? 'First-time host'
                                : `${stats.sessions_hosted} hosted`}
                        </span>
                    )}
                    {region && <span>· {region}</span>}
                    {!stats?.is_online && stats?.hours_since_active != null && stats.hours_since_active >= 4 && (
                        <span className="text-yellow-600" title={`Host hasn't been seen in ${stats.hours_since_active}h`}>
                            · ⚠ quiet {stats.hours_since_active}h
                        </span>
                    )}
                </div>
                {showRelationshipBadges && stats && (stats.is_favorited || stats.is_friend) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        {stats.is_favorited && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gaming-orange/15 px-2 py-0.5 text-[10px] font-bold text-gaming-orange">
                                ★ Favourite
                            </span>
                        )}
                        {stats.is_friend && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gaming-green/15 px-2 py-0.5 text-[10px] font-bold text-gaming-green">
                                ✓ Played before
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
