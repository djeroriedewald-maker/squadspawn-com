const TRUSTED_DOMAINS = [
    'instagram.com', 'www.instagram.com',
    'twitter.com', 'www.twitter.com', 'x.com', 'www.x.com',
    'tiktok.com', 'www.tiktok.com',
    'youtube.com', 'www.youtube.com', 'youtu.be',
    'twitch.tv', 'www.twitch.tv', 'clips.twitch.tv',
    'facebook.com', 'www.facebook.com',
    'discord.gg', 'discord.com',
    'steamcommunity.com', 'store.steampowered.com',
];

function getDomain(url: string): string | null {
    try {
        return new URL(url).hostname;
    } catch {
        return null;
    }
}

export default function SafeLink({
    href,
    children,
    className,
}: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    const domain = getDomain(href);
    const isTrusted = domain ? TRUSTED_DOMAINS.includes(domain) : false;

    // Trusted domains open directly, untrusted go through redirect
    if (isTrusted) {
        return (
            <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                {children}
            </a>
        );
    }

    return (
        <a
            href={route('external.redirect', { url: href })}
            className={className}
        >
            {children}
        </a>
    );
}
