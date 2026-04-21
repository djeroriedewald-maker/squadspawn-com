export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    profile?: Profile;
    games?: Game[];
}

export interface Profile {
    id: number;
    user_id: number;
    username: string;
    avatar?: string;
    bio?: string;
    looking_for: 'casual' | 'ranked' | 'friends' | 'any';
    region?: string;
    timezone?: string;
    available_times?: Record<string, boolean>;
    is_creator?: boolean;
    has_mic?: boolean;
    stream_url?: string;
    is_live?: boolean;
    reputation_score?: number;
    achievement_points?: number;
    xp?: number;
    level?: number;
    socials?: {
        discord?: string;
        instagram?: string;
        twitter?: string;
        tiktok?: string;
        youtube?: string;
        twitch?: string;
        facebook?: string;
    };
}

export interface Clip {
    id: number;
    user_id: number;
    game_id: number | null;
    title: string;
    url: string;
    platform: 'youtube' | 'twitch' | 'tiktok';
    thumbnail?: string;
    created_at?: string;
    user?: User;
    game?: Game;
}

export interface Game {
    id: number;
    name: string;
    slug: string;
    genre: string;
    platforms: string[];
    cover_image?: string;
    rank_system?: string[];
    roles?: string[];
    description?: string | null;
    rawg_id?: number | null;
    released_at?: string | null;
    pivot?: {
        rank?: string;
        role?: string;
        platform: string;
    };
}

export interface PlayerMatch {
    id: number;
    user_one_id: number;
    user_two_id: number;
    partner: User;
    created_at: string;
    latest_message?: Message;
}

export interface Message {
    id: number;
    match_id: number;
    sender_id: number;
    body: string;
    read_at?: string;
    created_at: string;
    sender?: User;
}

export interface Achievement {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    points: number;
    pivot?: {
        created_at: string;
    };
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
        achievementCount?: number;
    };
};
