const DISCORD_ICON = 'M20.317 4.3698a19.791 19.791 0 00-4.885-1.5152.0729.0729 0 00-.0785.0378c-.2107.3748-.4443.8632-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1641-.3933-.4058-.8747-.6177-1.2495a.077.077 0 00-.0785-.0378 19.736 19.736 0 00-4.8852 1.5152.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.299 12.299 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z';

const SOCIALS_CONFIG: Record<string, { label: string; color: string; urlPrefix: string; icon: string }> = {
    instagram: { label: 'Instagram', color: 'text-[#E4405F] hover:bg-[#E4405F]/10', urlPrefix: 'https://instagram.com/', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
    twitter: { label: 'X', color: 'text-white hover:bg-white/10', urlPrefix: 'https://x.com/', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
    tiktok: { label: 'TikTok', color: 'text-white hover:bg-white/10', urlPrefix: 'https://tiktok.com/@', icon: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' },
    youtube: { label: 'YouTube', color: 'text-[#FF0000] hover:bg-[#FF0000]/10', urlPrefix: 'https://youtube.com/', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
    twitch: { label: 'Twitch', color: 'text-[#9146FF] hover:bg-[#9146FF]/10', urlPrefix: 'https://twitch.tv/', icon: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z' },
    facebook: { label: 'Facebook', color: 'text-[#1877F2] hover:bg-[#1877F2]/10', urlPrefix: 'https://facebook.com/', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
};

function isDiscordInvite(value: string): boolean {
    return value.includes('discord.gg/') || value.includes('discord.com/invite/');
}

function getDiscordUrl(value: string): string | null {
    if (value.startsWith('https://')) return value;
    if (value.startsWith('discord.gg/')) return 'https://' + value;
    return null;
}

export default function SocialLinks({ socials }: { socials?: Record<string, string> }) {
    if (!socials) return null;

    const activeSocials = Object.entries(socials).filter(([_, value]) => value && value.trim());
    if (activeSocials.length === 0) return null;

    const discordValue = socials.discord?.trim();
    const otherSocials = activeSocials.filter(([key]) => key !== 'discord');

    const getUrl = (key: string, value: string) => {
        if (value.startsWith('http')) return value;
        const prefix = SOCIALS_CONFIG[key]?.urlPrefix || '';
        return prefix + value.replace(/^@/, '');
    };

    return (
        <div className="space-y-3">
            {/* Discord - prominent */}
            {discordValue && (
                <div>
                    {isDiscordInvite(discordValue) ? (
                        <a
                            href={getDiscordUrl(discordValue) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-3 transition hover:bg-[#5865F2]/20"
                        >
                            <svg className="h-5 w-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24"><path d={DISCORD_ICON} /></svg>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-white">Join Discord Server</p>
                                <p className="text-[10px] text-gray-400">{discordValue}</p>
                            </div>
                            <svg className="h-4 w-4 text-[#5865F2]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                        </a>
                    ) : (
                        <div className="flex items-center gap-2.5 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-3">
                            <svg className="h-5 w-5 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24"><path d={DISCORD_ICON} /></svg>
                            <div>
                                <p className="text-xs text-gray-400">Discord</p>
                                <p className="text-sm font-medium text-white">{discordValue}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Other socials */}
            {otherSocials.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {otherSocials.map(([key, value]) => {
                        const config = SOCIALS_CONFIG[key];
                        if (!config) return null;
                        const url = getUrl(key, value);

                        return (
                            <a
                                key={key}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 transition ${config.color}`}
                                title={config.label}
                            >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d={config.icon} /></svg>
                                <span className="text-xs">{value.replace(/^@/, '')}</span>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
