/**
 * Banner gradient presets for profiles. Values are raw CSS `background`
 * strings so they don't rely on themed Tailwind tokens (which invert in
 * dark mode — see feedback_themed_tokens). Each preset is readable with
 * white text on the left portion, which is where we render the username.
 */

export interface BannerPreset {
    id: string;
    name: string;
    /** Full CSS background — used inline via `style`. */
    background: string;
    /** Subtle accent visible in the picker thumbnail only. */
    hint?: string;
}

export const BANNER_PRESETS: BannerPreset[] = [
    {
        id: 'neon-pulse',
        name: 'Neon Pulse',
        background: 'linear-gradient(135deg, #1a0a15 0%, #4a0519 35%, #E6002E 75%, #FF4d6d 100%)',
        hint: 'Red neon · signature',
    },
    {
        id: 'deep-ocean',
        name: 'Deep Ocean',
        background: 'linear-gradient(135deg, #071836 0%, #0c3d6b 40%, #0892A5 80%, #22D3EE 100%)',
    },
    {
        id: 'cyber-dawn',
        name: 'Cyber Dawn',
        background: 'linear-gradient(135deg, #2d0b3a 0%, #5b1180 35%, #c026a3 70%, #fb7185 100%)',
    },
    {
        id: 'matrix',
        name: 'Matrix',
        background: 'linear-gradient(135deg, #04130a 0%, #0f3d24 35%, #10B981 75%, #84cc16 100%)',
    },
    {
        id: 'midnight',
        name: 'Midnight',
        background: 'linear-gradient(135deg, #0b0f1e 0%, #1e1b3a 45%, #433c74 80%, #7c78d8 100%)',
    },
    {
        id: 'sunset',
        name: 'Sunset',
        background: 'linear-gradient(135deg, #1a0303 0%, #8b1e1e 30%, #f59e0b 65%, #fecaca 100%)',
    },
    {
        id: 'aurora',
        name: 'Aurora',
        background: 'linear-gradient(135deg, #0a1e3a 0%, #3b2a6b 35%, #9333ea 70%, #22D3EE 100%)',
    },
    {
        id: 'monochrome',
        name: 'Monochrome',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1f1f2a 40%, #52525b 75%, #d4d4d8 100%)',
    },
];

export function findPreset(id?: string | null): BannerPreset | undefined {
    if (!id) return undefined;
    return BANNER_PRESETS.find((p) => p.id === id);
}

export const DEFAULT_PRESET_ID = 'neon-pulse';
