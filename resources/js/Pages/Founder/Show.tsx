import FounderBadge from '@/Components/FounderBadge';
import SeoHead from '@/Components/SeoHead';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface Founder {
    id: number;
    name: string;
    username: string | null;
    avatar: string | null;
    founder_number: number | null;
    is_og_founder: boolean;
    joined_human: string;
}

interface Props {
    founder: Founder;
}

export default function FounderShow({ founder }: Props) {
    const isOg = founder.is_og_founder;
    const displayName = founder.username ?? founder.name;
    const initial = (founder.username ?? founder.name)[0]?.toUpperCase() ?? '?';
    const authedUser = (usePage().props as { auth?: { user?: { id?: number } } }).auth?.user;
    const isOwnCard = authedUser?.id === founder.id;

    const [copied, setCopied] = useState(false);
    function copyShareUrl() {
        const url = window.location.href;
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => alert('Could not copy URL — copy from the address bar.'));
    }

    return (
        <GuestLayout>
            <SeoHead fallbackTitle={`${displayName} · Founding Member`} />

            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-4 py-12">
                <div className="w-full">
                    {/* Header strip */}
                    <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-neon-red">
                        SquadSpawn · {isOg ? 'OG Founder' : 'Founding Member'}
                    </p>

                    {/* The card */}
                    <article
                        className={`relative overflow-hidden rounded-3xl border bg-white shadow-2xl ${
                            isOg
                                ? 'border-yellow-400/40 shadow-amber-500/10'
                                : 'border-neon-red/30 shadow-neon-red/10'
                        }`}
                    >
                        {/* Backdrop glow */}
                        <div
                            className={`absolute inset-0 bg-gradient-to-br ${
                                isOg
                                    ? 'from-yellow-400/15 via-amber-500/5 to-transparent'
                                    : 'from-neon-red/10 via-gaming-pink/5 to-transparent'
                            } pointer-events-none`}
                        />

                        <div className="relative p-8 sm:p-10">
                            {/* Avatar + identity */}
                            <div className="flex flex-col items-center text-center">
                                <div
                                    className={`mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full ring-4 ${
                                        isOg ? 'ring-yellow-400/40' : 'ring-neon-red/30'
                                    }`}
                                >
                                    {founder.avatar ? (
                                        <img src={founder.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div
                                            className={`flex h-full w-full items-center justify-center text-3xl font-black text-white ${
                                                isOg
                                                    ? 'bg-gradient-to-br from-yellow-400 to-amber-600'
                                                    : 'bg-gradient-to-br from-neon-red to-gaming-pink'
                                            }`}
                                        >
                                            {initial}
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-2xl font-black text-ink-900 sm:text-3xl">{displayName}</h1>
                                <p className="mt-1 text-xs text-ink-500">Joined {founder.joined_human}</p>
                            </div>

                            {/* Big badge */}
                            <div className="mt-6">
                                <FounderBadge
                                    number={founder.founder_number}
                                    isOgFounder={founder.is_og_founder}
                                    size="lg"
                                />
                            </div>

                            {/* Pitch */}
                            <p className="mt-6 text-center text-sm text-ink-700 sm:text-base">
                                {isOg ? (
                                    <>
                                        <strong className="text-amber-600">Hand-picked seed.</strong> {displayName} was here
                                        before SquadSpawn opened to the world — a permanent badge they'll keep no matter
                                        how big this gets.
                                    </>
                                ) : (
                                    <>
                                        <strong className="text-neon-red">Permanent badge.</strong> The first 500 members get
                                        Founding Member status for life. {displayName} grabbed{' '}
                                        <strong>#{founder.founder_number}</strong>. There are still spots left.
                                    </>
                                )}
                            </p>

                            {/* CTA row */}
                            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                                {!authedUser && (
                                    <Link
                                        href={route('register')}
                                        className="rounded-xl bg-neon-red px-6 py-3 text-sm font-bold text-white shadow-md shadow-neon-red/30 hover:bg-neon-red/90"
                                    >
                                        Claim your founder spot →
                                    </Link>
                                )}
                                {isOwnCard && (
                                    <button
                                        type="button"
                                        onClick={copyShareUrl}
                                        className="rounded-xl border border-ink-900/10 bg-white px-6 py-3 text-sm font-bold text-ink-700 hover:border-neon-red/30 hover:text-neon-red"
                                    >
                                        {copied ? '✓ Link copied' : 'Copy share link'}
                                    </button>
                                )}
                                {!isOwnCard && authedUser && (
                                    <Link
                                        href={route('player.show', { username: founder.username || founder.id })}
                                        className="rounded-xl border border-ink-900/10 bg-white px-6 py-3 text-sm font-bold text-ink-700 hover:border-neon-red/30 hover:text-neon-red"
                                    >
                                        View profile →
                                    </Link>
                                )}
                            </div>
                        </div>
                    </article>

                    {/* Footer link */}
                    <p className="mt-6 text-center text-xs text-ink-500">
                        <Link href="/" className="hover:text-neon-red">
                            ← Back to SquadSpawn
                        </Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
