import { Game } from '@/types';
import { BANNER_PRESETS, DEFAULT_PRESET_ID, findPreset } from '@/utils/bannerPresets';
import { ReactNode } from 'react';

/**
 * Universal profile banner renderer.
 *
 * Three modes:
 *   - `preset`  → one of the curated gradients in utils/bannerPresets.
 *   - `game`    → the user's main-game cover art, blurred and darkened
 *                 so the username on top stays readable.
 *   - (none)    → falls back to the default preset so there is never a
 *                 flat white block.
 *
 * The children prop renders on top of the banner (username, level etc)
 * inside a dark-gradient scrim on the left, matching the visual in both
 * light and dark theme.
 */
export function ProfileBanner({
    style,
    preset,
    mainGame,
    className = '',
    heightClass = 'h-40 sm:h-48',
    children,
}: {
    style?: string | null;
    preset?: string | null;
    mainGame?: Game | null;
    className?: string;
    heightClass?: string;
    children?: ReactNode;
}) {
    // Normalise: anything that isn't an explicit game-cover request is
    // treated as a preset, defaulting to the signature neon-pulse.
    const isGameMode = style === 'game' && !!mainGame?.cover_image;
    const selected = findPreset(preset) || findPreset(DEFAULT_PRESET_ID)!;

    return (
        <div className={`relative overflow-hidden ${heightClass} ${className}`}>
            {isGameMode ? (
                <>
                    <img
                        src={mainGame!.cover_image!}
                        alt=""
                        aria-hidden
                        className="h-full w-full scale-110 object-cover blur-sm"
                    />
                    {/* Dark scrim on the left so text stays readable over
                        any game art; feather fades out to the right. */}
                    <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                            background:
                                'linear-gradient(90deg, rgba(10,8,15,0.85) 0%, rgba(10,8,15,0.6) 45%, rgba(10,8,15,0.2) 75%, rgba(10,8,15,0) 100%)',
                        }}
                    />
                </>
            ) : (
                <div aria-hidden className="h-full w-full" style={{ background: selected.background }} />
            )}

            {/* Subtle grid overlay + red-neon glow — keeps the SquadSpawn
                look even on the game-cover fallback. */}
            <div aria-hidden className="absolute inset-0 bg-grid opacity-15" />
            <div aria-hidden className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-neon-red/20 blur-3xl" />

            {/* Pill in the bottom-right showing the game, if we have one. */}
            {mainGame && (
                <div className="absolute bottom-2 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-sm">
                    {mainGame.cover_image && (
                        <img src={mainGame.cover_image} alt="" className="h-4 w-6 rounded-sm object-cover" />
                    )}
                    <span className="text-[10px] font-semibold text-white">{mainGame.name}</span>
                    {mainGame.pivot?.rank && (
                        <span className="text-[10px] text-gaming-green">{mainGame.pivot.rank}</span>
                    )}
                </div>
            )}

            {children && <div className="relative z-10 flex h-full w-full items-end p-4 sm:p-6">{children}</div>}
        </div>
    );
}

/** Small preview chip used in the picker; shows the gradient without extras. */
export function BannerPresetThumb({
    preset,
    active = false,
    onClick,
    label,
}: {
    preset: (typeof BANNER_PRESETS)[number];
    active?: boolean;
    onClick?: () => void;
    label?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative aspect-[5/2] overflow-hidden rounded-lg border transition ${
                active ? 'border-neon-red ring-2 ring-neon-red/40' : 'border-ink-900/10 hover:border-neon-red/40'
            }`}
            aria-pressed={active}
        >
            <div className="absolute inset-0" style={{ background: preset.background }} />
            <div className="absolute inset-0 bg-grid opacity-15" />
            <div className="relative flex h-full items-end p-2">
                <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    {label ?? preset.name}
                </span>
            </div>
            {active && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neon-red text-white">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </span>
            )}
        </button>
    );
}
