import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    referralCode: string;
    inviteUrl: string;
    invitedCount: number;
}

export default function InviteIndex({ referralCode, inviteUrl, invitedCount }: Props) {
    const [copied, setCopied] = useState<'url' | 'code' | null>(null);

    function copy(text: string, which: 'url' | 'code') {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(which);
            setTimeout(() => setCopied(null), 1500);
        });
    }

    const shareText = 'Come squad up with me on SquadSpawn — find teammates for your games and build your reputation.';
    const encodedUrl = encodeURIComponent(inviteUrl);
    const encodedText = encodeURIComponent(shareText);

    const [discordCopied, setDiscordCopied] = useState(false);
    function handleDiscordShare() {
        // Discord has no prefill API for DM/channel windows. Copy the
        // message + URL to the clipboard so the user can paste once
        // Discord opens. The href below opens the web client; if the
        // desktop app is installed it'll prompt to open there instead.
        navigator.clipboard.writeText(`${shareText} ${inviteUrl}`).then(() => {
            setDiscordCopied(true);
            setTimeout(() => setDiscordCopied(false), 2500);
        });
    }

    const shares: { name: string; href: string; icon: JSX.Element; color: string; onClick?: () => void }[] = [
        {
            name: 'WhatsApp',
            href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
            color: 'bg-[#25D366] hover:bg-[#1ea952]',
            icon: (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.6 6.3A7.85 7.85 0 0 0 12 4a7.9 7.9 0 0 0-6.8 11.85L4 20l4.3-1.12A7.88 7.88 0 0 0 20 12a7.84 7.84 0 0 0-2.4-5.7Zm-5.6 12.1a6.56 6.56 0 0 1-3.35-.92l-.24-.14-2.5.66.67-2.44-.16-.25a6.57 6.57 0 1 1 12.18-3.47 6.56 6.56 0 0 1-6.6 6.56Zm3.6-4.91c-.2-.1-1.17-.58-1.35-.65-.18-.07-.31-.1-.44.1-.13.2-.5.65-.61.78-.11.13-.23.15-.42.05-.2-.1-.84-.31-1.6-1-.59-.52-1-1.17-1.11-1.37-.11-.2-.01-.31.09-.4.09-.09.2-.23.3-.35.1-.12.13-.2.2-.33.07-.13.03-.25-.02-.35-.05-.1-.44-1.06-.6-1.45-.16-.39-.32-.33-.44-.34-.11 0-.24-.01-.37-.01a.7.7 0 0 0-.5.23 2.1 2.1 0 0 0-.66 1.56c0 .92.66 1.8.76 1.93.1.12 1.3 2 3.15 2.82.44.19.78.3 1.05.39.44.14.84.12 1.16.07.35-.05 1.07-.44 1.22-.86.15-.42.15-.78.1-.86-.04-.08-.17-.13-.37-.22Z" /></svg>
            ),
        },
        {
            name: 'X',
            href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            color: 'bg-[#000000] hover:bg-[#1a1a1a]',
            icon: (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            ),
        },
        {
            name: discordCopied ? 'Copied — paste in Discord' : 'Discord',
            href: 'https://discord.com/app',
            onClick: handleDiscordShare,
            color: 'bg-[#5865F2] hover:bg-[#4752c4]',
            icon: (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.3 4.4A18.75 18.75 0 0 0 15.8 3l-.24.27c1.65.41 2.42 1 3.22 1.7-1.32-.67-2.62-1.3-4.87-1.3s-3.56.63-4.87 1.3c.8-.7 1.72-1.3 3.22-1.7L12 3a18.7 18.7 0 0 0-4.3 1.4C5.45 7.75 4.83 11 5.06 14.24c0 0 1.4 1.94 5 2.06 0 0 .61-.73 1.1-1.37-2.08-.63-2.88-1.93-2.88-1.93s.17.12.47.29c.02.01.03.03.06.05.05.02.09.05.15.07.4.22.8.4 1.17.55.66.25 1.44.5 2.38.68 1.22.23 2.66.31 4.22.02.76-.13 1.55-.35 2.36-.68.58-.22 1.22-.54 1.9-.99 0 0-.84 1.33-2.98 1.94.48.63 1.09 1.35 1.09 1.35 3.6-.12 5-2.06 5-2.06.16-3.22-.46-6.48-2.64-9.83ZM9.44 13.34c-.87 0-1.57-.82-1.57-1.82s.7-1.82 1.57-1.82c.88 0 1.58.82 1.57 1.82.01 1-.7 1.82-1.57 1.82Zm5.14 0c-.87 0-1.57-.82-1.57-1.82s.7-1.82 1.57-1.82c.88 0 1.58.82 1.57 1.82 0 1-.7 1.82-1.57 1.82Z" /></svg>
            ),
        },
        {
            name: 'Email',
            href: `mailto:?subject=${encodeURIComponent('Come play with me on SquadSpawn')}&body=${encodedText}%0A%0A${encodedUrl}`,
            color: 'bg-[#4b5563] hover:bg-[#374151]',
            icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
            ),
        },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Invite friends" />

            {/* Hero — visual cue that this is about bringing your own people in,
                not another utility page. gamer3.jpg has a "team" vibe that fits. */}
            <div className="relative h-40 overflow-hidden sm:h-52">
                <img src="/images/gamer3.jpg" alt="" className="h-full w-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-b from-ink-900/60 via-bone-50/40 to-bone-50" />
            </div>

            <div className="py-8">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6 -mt-20 rounded-2xl border border-ink-900/10 bg-white p-6 text-center shadow-lg">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neon-red/30 bg-neon-red/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-neon-red">
                            Founding squad
                        </div>
                        <h1 className="mt-3 text-3xl font-bold text-ink-900 sm:text-4xl">Bring your squad</h1>
                        <p className="mt-2 text-ink-500">
                            Share your personal link — every friend who joins gets attributed to you, builds the community faster, and unlocks the Squad Builder badge once you've invited three.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="mb-6 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-ink-900/10 bg-white p-4 text-center">
                            <div className="text-3xl font-black text-neon-red">{invitedCount}</div>
                            <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-ink-500">Invites landed</div>
                        </div>
                        <div className="rounded-xl border border-ink-900/10 bg-white p-4 text-center">
                            <div className="text-3xl font-black text-ink-900">{Math.max(3 - invitedCount, 0)}</div>
                            <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-ink-500">To Squad Builder</div>
                        </div>
                        <div className="rounded-xl border border-ink-900/10 bg-white p-4 text-center">
                            <div className="font-mono text-xl font-bold tracking-widest text-ink-900">{referralCode}</div>
                            <div className="mt-1 text-xs font-semibold uppercase tracking-widest text-ink-500">Your code</div>
                        </div>
                    </div>

                    {/* Invite link */}
                    <div className="mb-6 rounded-xl border border-ink-900/10 bg-white p-5">
                        <label className="mb-2 block text-sm font-semibold text-ink-900">Your invite link</label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                                readOnly
                                value={inviteUrl}
                                onClick={(e) => (e.currentTarget as HTMLInputElement).select()}
                                className="flex-1 rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => copy(inviteUrl, 'url')}
                                className="rounded-lg bg-neon-red px-4 py-2 text-sm font-bold text-white transition hover:bg-neon-red/90"
                            >
                                {copied === 'url' ? '✓ Copied' : 'Copy link'}
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-ink-500">
                            Or share just the code: <span className="font-mono font-semibold">{referralCode}</span>{' '}
                            <button
                                type="button"
                                onClick={() => copy(referralCode, 'code')}
                                className="text-neon-red hover:underline"
                            >
                                {copied === 'code' ? '✓ copied' : 'copy'}
                            </button>
                        </p>
                    </div>

                    {/* Share buttons */}
                    <div className="rounded-xl border border-ink-900/10 bg-white p-5">
                        <label className="mb-3 block text-sm font-semibold text-ink-900">Share to</label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {shares.map((s) => (
                                <a
                                    key={s.name}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={s.onClick}
                                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-white transition ${s.color}`}
                                >
                                    {s.icon}
                                    {s.name}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* How it works */}
                    <div className="mt-6 rounded-xl border border-ink-900/10 bg-bone-50 p-5 text-sm text-ink-700">
                        <p className="mb-2 font-semibold text-ink-900">How it works</p>
                        <ol className="list-decimal space-y-1 pl-5 text-ink-500">
                            <li>Share your link with a friend — WhatsApp, Discord, anywhere.</li>
                            <li>When they sign up through it, they're linked to you as your invite.</li>
                            <li>Hit 3 invites and unlock the Squad Builder badge on your profile.</li>
                            <li>Keep going — 10 invites gets you Community Champion (coming soon).</li>
                        </ol>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
