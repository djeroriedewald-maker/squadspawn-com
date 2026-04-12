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

export interface Game {
    id: number;
    name: string;
    slug: string;
    genre: string;
    platforms: string[];
    cover_image?: string;
    rank_system?: string[];
    roles?: string[];
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

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: {
        user: User;
    };
};
