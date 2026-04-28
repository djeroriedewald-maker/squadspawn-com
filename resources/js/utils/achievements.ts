export const achievementIconMap: Record<string, string> = {
    heart: '\u2764\uFE0F',
    users: '\uD83D\uDC65',
    flag: '\uD83D\uDEA9',
    shield: '\uD83D\uDEE1\uFE0F',
    video: '\uD83C\uDFA5',
    gamepad: '\uD83C\uDFAE',
    chat: '\uD83D\uDCAC',
    star: '\u2B50',
    trophy: '\uD83C\uDFC6',
    megaphone: '\uD83D\uDCE3',
    fire: '\uD83D\uDD25',
    check: '\u2705',
};

export const achievementFallbackIcon = '\uD83C\uDFC6';

export interface AchievementColorClasses {
    bg: string;
    border: string;
    text: string;
    glow: string;
    bar: string;
    accent: string;
    hoverBorder: string;
    hoverGlow: string;
}

// Color keys in the DB are legacy names ('purple', 'green', etc). 'purple' is
// remapped to neon-red to match the new theme. Hover variants are explicit
// so Tailwind JIT includes them — class names must appear as literal strings.
export const achievementColorClasses: Record<string, AchievementColorClasses> = {
    purple: {
        bg: 'bg-neon-red/10',
        border: 'border-neon-red/30',
        text: 'text-neon-red',
        glow: 'shadow-[0_0_15px_rgba(230,0,46,0.3)]',
        bar: 'bg-neon-red',
        accent: 'bg-neon-red',
        hoverBorder: 'hover:border-neon-red/40',
        hoverGlow: 'hover:shadow-[0_10px_30px_-10px_rgba(230,0,46,0.4)]',
    },
    green: {
        bg: 'bg-gaming-green/10',
        border: 'border-gaming-green/30',
        text: 'text-gaming-green',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        bar: 'bg-gaming-green',
        accent: 'bg-gaming-green',
        hoverBorder: 'hover:border-gaming-green/40',
        hoverGlow: 'hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.4)]',
    },
    cyan: {
        bg: 'bg-gaming-cyan/10',
        border: 'border-gaming-cyan/30',
        text: 'text-gaming-cyan',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]',
        bar: 'bg-gaming-cyan',
        accent: 'bg-gaming-cyan',
        hoverBorder: 'hover:border-gaming-cyan/40',
        hoverGlow: 'hover:shadow-[0_10px_30px_-10px_rgba(34,211,238,0.4)]',
    },
    pink: {
        bg: 'bg-gaming-pink/10',
        border: 'border-gaming-pink/30',
        text: 'text-gaming-pink',
        glow: 'shadow-[0_0_15px_rgba(244,114,182,0.3)]',
        bar: 'bg-gaming-pink',
        accent: 'bg-gaming-pink',
        hoverBorder: 'hover:border-gaming-pink/40',
        hoverGlow: 'hover:shadow-[0_10px_30px_-10px_rgba(244,114,182,0.4)]',
    },
    orange: {
        bg: 'bg-gaming-orange/10',
        border: 'border-gaming-orange/30',
        text: 'text-gaming-orange',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
        bar: 'bg-yellow-500',
        accent: 'bg-gaming-orange',
        hoverBorder: 'hover:border-gaming-orange/40',
        hoverGlow: 'hover:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.4)]',
    },
};

export function getAchievementIcon(icon: string): string {
    return achievementIconMap[icon] || achievementFallbackIcon;
}

export function getAchievementColors(color: string): AchievementColorClasses {
    return achievementColorClasses[color] || achievementColorClasses.purple;
}

// Tier-based visual treatment — drives the per-tile background image,
// ring colour, and "rarity" pill on the achievement page. Keeps tier
// styling centralised so the component stays readable.
export interface AchievementTierStyle {
    label: string;
    pill: string;          // small "BRONZE" pill on the tile
    ring: string;          // border / ring colour when earned
    glow: string;          // outer glow when earned
    bgImage: string;       // /images/achievements/{slug}.jpg fallback to tier
    fallbackImage: string; // generic per-tier image used when slug image missing
    accent: string;        // accent text colour (e.g. for the +XP pill)
}

export const achievementTierStyles: Record<string, AchievementTierStyle> = {
    bronze: {
        label: 'BRONZE',
        pill: 'bg-amber-700/15 text-amber-700 ring-amber-700/30',
        ring: 'ring-amber-700/40 border-amber-700/30',
        glow: 'shadow-[0_0_24px_-4px_rgba(180,83,9,0.55)]',
        bgImage: '',
        fallbackImage: '/images/achievements/_tier-bronze.jpg',
        accent: 'text-amber-700',
    },
    silver: {
        label: 'SILVER',
        pill: 'bg-slate-300/20 text-slate-300 ring-slate-300/40',
        ring: 'ring-slate-300/50 border-slate-300/40',
        glow: 'shadow-[0_0_28px_-4px_rgba(203,213,225,0.55)]',
        bgImage: '',
        fallbackImage: '/images/achievements/_tier-silver.jpg',
        accent: 'text-slate-300',
    },
    gold: {
        label: 'GOLD',
        pill: 'bg-yellow-400/15 text-yellow-400 ring-yellow-400/40',
        ring: 'ring-yellow-400/50 border-yellow-400/40',
        glow: 'shadow-[0_0_32px_-4px_rgba(250,204,21,0.65)]',
        bgImage: '',
        fallbackImage: '/images/achievements/_tier-gold.jpg',
        accent: 'text-yellow-400',
    },
    platinum: {
        label: 'PLATINUM',
        pill: 'bg-gradient-to-r from-yellow-300 to-fuchsia-400 bg-clip-text text-transparent ring-yellow-300/40',
        ring: 'ring-fuchsia-400/40 border-yellow-300/40',
        glow: 'shadow-[0_0_40px_-4px_rgba(250,204,21,0.7)]',
        bgImage: '',
        fallbackImage: '/images/achievements/_tier-platinum.jpg',
        accent: 'text-yellow-300',
    },
};

export function getTierStyle(tier?: string | null): AchievementTierStyle {
    return achievementTierStyles[tier || 'bronze'] ?? achievementTierStyles.bronze;
}
