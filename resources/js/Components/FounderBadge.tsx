/**
 * Cold-start social proof. Two distinct tiers, rendered through one
 * component so callers don't have to branch:
 *
 *   - OG Founder (handpicked seed)  → gold gradient, 👑 icon, top tier
 *   - Founding Member #N (id ≤ 500) → red/pink gradient, ★ icon
 *
 * If `isOgFounder` is true the OG visual wins regardless of `number`.
 *
 * Three sizes:
 *   - sm: 16px chip for chat avatars / inline use
 *   - md: pill with label for profile cards (default)
 *   - lg: full callout card for the dashboard
 *
 * Renders nothing if neither status applies, so callers can safely
 * scatter it without conditional wrapping.
 */

interface Props {
    number: number | null | undefined;
    isOgFounder?: boolean;
    size?: 'sm' | 'md' | 'lg';
    cap?: number;
    className?: string;
}

export default function FounderBadge({
    number,
    isOgFounder = false,
    size = 'md',
    cap = 500,
    className = '',
}: Props) {
    if (!isOgFounder && !number) return null;

    const og = isOgFounder;
    const tooltip = og
        ? 'OG Founder — handpicked early supporter'
        : `Founding member #${number} of ${cap}`;
    const icon = og ? '♛' : '★';
    const label = og ? 'OG Founder' : `Founder #${number}`;

    if (size === 'sm') {
        return (
            <span
                title={tooltip}
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white shadow-sm ${
                    og
                        ? 'bg-gradient-to-br from-yellow-400 to-amber-600'
                        : 'bg-gradient-to-br from-neon-red to-gaming-pink'
                } ${className}`}
            >
                {icon}
            </span>
        );
    }

    if (size === 'lg') {
        return (
            <div
                className={`flex items-center gap-3 rounded-2xl border p-4 ${
                    og
                        ? 'border-yellow-400/40 bg-gradient-to-br from-yellow-400/10 via-amber-500/5 to-transparent'
                        : 'border-neon-red/30 bg-gradient-to-br from-neon-red/10 via-gaming-pink/5 to-transparent'
                } ${className}`}
            >
                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl font-black text-white shadow-md ${
                        og
                            ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-amber-500/30'
                            : 'bg-gradient-to-br from-neon-red to-gaming-pink shadow-neon-red/30'
                    }`}
                >
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${og ? 'text-amber-600' : 'text-neon-red'}`}>
                        {og ? 'OG Founder' : 'Founding member'}
                    </p>
                    {og ? (
                        <p className="text-lg font-black text-ink-900">Day-zero squad</p>
                    ) : (
                        <p className="text-lg font-black text-ink-900">
                            #{number} <span className="text-sm font-bold text-ink-500">of {cap}</span>
                        </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-ink-500">
                        {og ? 'Handpicked. Permanent badge + Plus.' : 'Permanent badge · day-one squad'}
                    </p>
                </div>
            </div>
        );
    }

    // md (default)
    return (
        <span
            title={tooltip}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                og
                    ? 'border-yellow-400/40 bg-yellow-400/10 text-amber-600'
                    : 'border-neon-red/30 bg-neon-red/10 text-neon-red'
            } ${className}`}
        >
            <span className="text-[8px]">{icon}</span>
            {label}
        </span>
    );
}
