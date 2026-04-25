/**
 * Cold-start social proof: a chip-style badge worn by the first 500 users.
 * Three sizes:
 *   - sm: 16px chip for chat avatars / inline use
 *   - md: pill with "#N" for profile cards (default)
 *   - lg: full "Founding Member #N of 500" callout for the dashboard
 *
 * Pass `cap` to override the displayed total (defaults to 500, mirrors
 * User::FOUNDER_CAP server-side). Renders nothing if `number` is nullish
 * so callers can safely scatter it without conditional wrapping.
 */

interface Props {
    number: number | null | undefined;
    size?: 'sm' | 'md' | 'lg';
    cap?: number;
    className?: string;
}

export default function FounderBadge({ number, size = 'md', cap = 500, className = '' }: Props) {
    if (!number) return null;

    if (size === 'sm') {
        return (
            <span
                title={`Founding member #${number} of ${cap}`}
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-neon-red to-gaming-pink text-[8px] font-black text-white shadow-sm ${className}`}
            >
                ★
            </span>
        );
    }

    if (size === 'lg') {
        return (
            <div
                className={`flex items-center gap-3 rounded-2xl border border-neon-red/30 bg-gradient-to-br from-neon-red/10 via-gaming-pink/5 to-transparent p-4 ${className}`}
            >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neon-red to-gaming-pink text-xl font-black text-white shadow-md shadow-neon-red/30">
                    ★
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neon-red">
                        Founding member
                    </p>
                    <p className="text-lg font-black text-ink-900">
                        #{number} <span className="text-sm font-bold text-ink-500">of {cap}</span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-500">
                        Permanent badge · day-one squad
                    </p>
                </div>
            </div>
        );
    }

    // md (default)
    return (
        <span
            title={`Founding member #${number} of ${cap}`}
            className={`inline-flex items-center gap-1 rounded-full border border-neon-red/30 bg-neon-red/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon-red ${className}`}
        >
            <span className="text-[8px]">★</span>
            Founder #{number}
        </span>
    );
}
