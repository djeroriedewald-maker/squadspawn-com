import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState } from 'react';

interface CommunityPost {
    id: number;
    slug: string;
    user_id: number;
    game_id: number | null;
    title: string;
    body: string;
    type: 'discussion' | 'question' | 'tip' | 'team' | 'news';
    upvotes: number;
    downvotes: number;
    comments_count: number;
    created_at: string;
    user?: User;
    game?: Game;
    hidden_at?: string | null;
    hidden_reason?: string | null;
    locked_at?: string | null;
    pinned_at?: string | null;
}

const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
        discussion: 'bg-purple-500/20 text-purple-400',
        question: 'bg-cyan-500/20 text-cyan-400',
        tip: 'bg-emerald-500/20 text-emerald-400',
        team: 'bg-pink-500/20 text-pink-400',
        news: 'bg-orange-500/20 text-orange-400',
    };
    return (
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${styles[type] || 'bg-ink-900/10 text-ink-500'}`}>
            {type}
        </span>
    );
};

function timeAgo(dateStr: string): string {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

export default function CommunityIndex({
    posts,
    games,
    filters,
    userVotes,
    canModerate = false,
}: {
    posts: { data: CommunityPost[]; links: any[]; current_page: number; last_page: number };
    games: Game[];
    filters: { game_id?: string; type?: string; sort?: string };
    userVotes: Record<number, number>;
    canModerate?: boolean;
}) {
    const { auth } = usePage<PageProps>().props;
    const isLoggedIn = !!auth?.user;
    const canMod = canModerate || (auth?.canModerate ?? false);

    const modAction = async (url: string) => {
        try {
            await axios.post(url);
            router.reload();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unknown';
            alert(`Mod action failed: ${msg} (${err.response?.status ?? 'network'})`);
        }
    };

    const [localVotes, setLocalVotes] = useState<Record<number, number>>(userVotes || {});
    const [localPosts, setLocalPosts] = useState<CommunityPost[]>(posts.data);
    const [votingId, setVotingId] = useState<number | null>(null);

    // Reload-after-mod-action delivers fresh props; mirror them into state.
    useEffect(() => {
        setLocalPosts(posts.data);
    }, [posts.data]);

    const handleVote = async (postId: number, vote: 1 | -1) => {
        if (!isLoggedIn || votingId === postId) return;
        setVotingId(postId);
        try {
            const post = localPosts.find((p) => p.id === postId);
            if (!post) return;
            const { data } = await axios.post(route('community.vote', { communityPost: post.slug }), { vote });
            setLocalPosts((prev) =>
                prev.map((p) =>
                    p.id === postId ? { ...p, upvotes: data.upvotes, downvotes: data.downvotes } : p,
                ),
            );
            setLocalVotes((prev) => {
                const current = prev[postId];
                if (current === vote) {
                    const next = { ...prev };
                    delete next[postId];
                    return next;
                }
                return { ...prev, [postId]: vote };
            });
        } catch {
            // ignore
        } finally {
            setVotingId(null);
        }
    };

    const handleFilter = (key: string, value: string) => {
        const params: Record<string, string | undefined> = { ...filters, [key]: value || undefined };
        // Remove empty params
        Object.keys(params).forEach((k) => {
            if (!params[k]) delete params[k];
        });
        router.get(route('community.index'), params, { preserveState: true, replace: true });
    };

    const activeSort = filters.sort || 'hot';
    const postTypes = ['discussion', 'question', 'tip', 'team', 'news'];

    const pageContent = (
        <>
            <Head title="Community" />

            <div className="relative h-32 overflow-hidden sm:h-40">
                <img src="/images/gamer4.jpg" alt="" className="h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-bone-50/10 via-bone-50/50 to-bone-50" />
                <div className="absolute inset-0 flex items-end px-4 pb-5 sm:px-6 lg:px-8">
                    <div className="mx-auto flex w-full max-w-4xl items-end justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Community</h1>
                            <p className="mt-1 text-sm text-ink-500">Discuss, share tips, and connect with gamers</p>
                        </div>
                        {isLoggedIn ? (
                            <Link
                                href={route('community.create')}
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-neon-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neon-red/80"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                New Post
                            </Link>
                        ) : (
                            <Link
                                href={route('register')}
                                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-neon-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neon-red/80"
                            >
                                Sign Up to Post
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="overflow-x-hidden py-8">
                <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">

                    {/* Sort Tabs */}
                    <div className="mb-4 flex items-center gap-1 rounded-lg border border-ink-900/10 bg-white p-1 w-fit">
                        <button
                            onClick={() => handleFilter('sort', 'hot')}
                            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition ${
                                activeSort === 'hot'
                                    ? 'bg-neon-red text-white'
                                    : 'text-ink-500 hover:text-ink-900'
                            }`}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                            </svg>
                            Hot
                        </button>
                        <button
                            onClick={() => handleFilter('sort', 'new')}
                            className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition ${
                                activeSort === 'new'
                                    ? 'bg-neon-red text-white'
                                    : 'text-ink-500 hover:text-ink-900'
                            }`}
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            New
                        </button>
                    </div>

                    {/* Community nav links */}
                    <div className="mb-4 flex flex-wrap gap-2 text-xs">
                        <Link href={route('community.team')} className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 font-semibold text-ink-700 transition hover:border-gaming-cyan/40 hover:text-gaming-cyan">
                            🛡 Meet the team
                        </Link>
                        <Link href={route('community.guidelines')} className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 font-semibold text-ink-700 transition hover:border-neon-red/40 hover:text-neon-red">
                            📖 Guidelines
                        </Link>
                        {isLoggedIn && (
                            <Link href={route('reports.mine')} className="rounded-full border border-ink-900/10 bg-white px-3 py-1.5 font-semibold text-ink-700 transition hover:border-gaming-orange/40 hover:text-gaming-orange">
                                📝 My reports
                            </Link>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        <select
                            value={filters.game_id || ''}
                            onChange={(e) => handleFilter('game_id', e.target.value)}
                            className="rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                        >
                            <option value="">All Games</option>
                            {games.map((game) => (
                                <option key={game.id} value={game.id}>{game.name}</option>
                            ))}
                        </select>

                        <select
                            value={filters.type || ''}
                            onChange={(e) => handleFilter('type', e.target.value)}
                            className="rounded-lg border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                        >
                            <option value="">All Types</option>
                            {postTypes.map((t) => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Guest CTA */}
                    {!isLoggedIn && (
                        <div className="mb-6 rounded-xl border border-neon-red/20 bg-neon-red/5 p-6 text-center">
                            <p className="font-semibold text-ink-900">Join the conversation</p>
                            <p className="mt-1 text-sm text-ink-500">Create a free account to post, vote, and comment.</p>
                            <Link
                                href={route('register')}
                                className="mt-3 inline-block rounded-lg bg-neon-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-neon-red/80"
                            >
                                Sign Up Free
                            </Link>
                        </div>
                    )}

                    {/* Posts */}
                    {localPosts.length > 0 ? (
                        <div className="space-y-3">
                            {localPosts.map((post) => {
                                const score = post.upvotes - post.downvotes;
                                const userVote = localVotes[post.id];

                                return (
                                    <div
                                        key={post.id}
                                        className="flex gap-3 rounded-xl border border-ink-900/10 bg-white p-4 transition hover:border-ink-900/20"
                                    >
                                        {/* Vote column */}
                                        <div className="flex flex-col items-center gap-0.5 pt-0.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleVote(post.id, 1); }}
                                                disabled={!isLoggedIn}
                                                className={`rounded p-1 transition ${
                                                    userVote === 1
                                                        ? 'text-gaming-green'
                                                        : 'text-gray-500 hover:text-gaming-green'
                                                } ${!isLoggedIn ? 'cursor-default' : ''}`}
                                                title={isLoggedIn ? 'Upvote' : 'Log in to vote'}
                                            >
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            <span className={`text-xs font-bold ${
                                                userVote === 1 ? 'text-gaming-green' : userVote === -1 ? 'text-red-400' : 'text-ink-500'
                                            }`}>
                                                {score}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleVote(post.id, -1); }}
                                                disabled={!isLoggedIn}
                                                className={`rounded p-1 transition ${
                                                    userVote === -1
                                                        ? 'text-red-400'
                                                        : 'text-gray-500 hover:text-red-400'
                                                } ${!isLoggedIn ? 'cursor-default' : ''}`}
                                                title={isLoggedIn ? 'Downvote' : 'Log in to vote'}
                                            >
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.55-.24l-3.25-3.5a.75.75 0 111.1-1.02L10 15.148l2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5A.75.75 0 0110 17z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Post content */}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                {post.pinned_at && (
                                                    <span className="rounded-full bg-neon-red/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon-red">📌 Pinned</span>
                                                )}
                                                {post.locked_at && (
                                                    <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-600">🔒 Locked</span>
                                                )}
                                                {post.hidden_at && (
                                                    <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-500">Hidden</span>
                                                )}
                                                {typeBadge(post.type)}
                                                {post.game && (
                                                    <span className="flex items-center gap-1.5 rounded-full bg-ink-900/5 px-2.5 py-0.5 text-[10px] font-medium text-ink-700">
                                                        {post.game.cover_image && (
                                                            <img src={post.game.cover_image} alt="" className="h-3.5 w-3.5 rounded object-cover" />
                                                        )}
                                                        {post.game.name}
                                                    </span>
                                                )}
                                            </div>

                                            <Link
                                                href={route('community.show', { communityPost: post.slug })}
                                                className="block break-words text-base font-bold text-ink-900 transition hover:text-neon-red"
                                            >
                                                {post.title}
                                            </Link>

                                            {canMod && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {post.hidden_at ? (
                                                        <button type="button" onClick={(e) => { e.preventDefault(); modAction(`/mod/posts/${post.id}/unhide`); }} className="rounded bg-gaming-green/10 px-2 py-0.5 text-[10px] font-semibold text-gaming-green hover:bg-gaming-green/20">Unhide</button>
                                                    ) : (
                                                        <button type="button" onClick={(e) => { e.preventDefault(); const r = window.prompt('Reason for hiding (optional):', ''); if (r === null) return; axios.post(`/mod/posts/${post.id}/hide`, { reason: r }).then(() => router.reload()); }} className="rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500 hover:bg-red-500/20">Hide</button>
                                                    )}
                                                    {post.pinned_at ? (
                                                        <button type="button" onClick={(e) => { e.preventDefault(); modAction(`/mod/posts/${post.id}/unpin`); }} className="rounded bg-ink-900/5 px-2 py-0.5 text-[10px] font-semibold text-ink-700 hover:bg-ink-900/10">Unpin</button>
                                                    ) : (
                                                        <button type="button" onClick={(e) => { e.preventDefault(); modAction(`/mod/posts/${post.id}/pin`); }} className="rounded bg-neon-red/10 px-2 py-0.5 text-[10px] font-semibold text-neon-red hover:bg-neon-red/20">Pin</button>
                                                    )}
                                                </div>
                                            )}

                                            <p className="mt-1 break-words text-sm leading-relaxed text-ink-500 line-clamp-2">
                                                {post.body.length > 150 ? post.body.substring(0, 150) + '...' : post.body}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                                {/* Author */}
                                                <Link
                                                    href={route('player.show', { username: post.user?.profile?.username || post.user?.id })}
                                                    className="flex items-center gap-1.5 transition hover:text-ink-900"
                                                >
                                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20">
                                                        {post.user?.profile?.avatar ? (
                                                            <img src={post.user.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-[8px] font-bold text-neon-red">
                                                                {(post.user?.profile?.username?.[0] || post.user?.name?.[0] || '?').toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {post.user?.profile?.username || post.user?.name}
                                                </Link>

                                                <span>{timeAgo(post.created_at)}</span>

                                                {/* Comments count */}
                                                <Link
                                                    href={route('community.show', { communityPost: post.slug })}
                                                    className="flex items-center gap-1 transition hover:text-ink-900"
                                                >
                                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                                    </svg>
                                                    {post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-ink-900/10 bg-white p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-neon-red/10">
                                <svg className="h-10 w-10 text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-ink-900">Start the first thread</h3>
                            <p className="mb-6 text-ink-500">
                                Founders steer the conversation here. Drop a clip, call out a game-night, ask a balance question — whatever you'd want to read first.
                            </p>
                            {isLoggedIn ? (
                                <Link
                                    href={route('community.create')}
                                    className="inline-flex rounded-xl bg-neon-red px-6 py-3 font-semibold text-white shadow-sm shadow-neon-red/20 hover:bg-neon-red/80"
                                >
                                    Create the first post →
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="inline-flex rounded-xl bg-neon-red px-6 py-3 font-semibold text-white hover:bg-neon-red/80"
                                >
                                    Sign in to post
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Pagination */}
                    {posts.last_page > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-2">
                            {posts.links.map((link: any, i: number) => (
                                <button
                                    key={i}
                                    disabled={!link.url || link.active}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                        link.active
                                            ? 'bg-neon-red font-semibold text-white'
                                            : link.url
                                              ? 'text-ink-500 hover:bg-white hover:text-ink-900'
                                              : 'cursor-not-allowed text-gray-600'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    if (isLoggedIn) {
        return (
            <AuthenticatedLayout
                header={<h2 className="text-xl font-semibold leading-tight text-ink-900">Community</h2>}
            >
                {pageContent}
            </AuthenticatedLayout>
        );
    }

    return (
        <div className="min-h-screen bg-bone-50 text-ink-900">
            <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                <div className="flex items-center gap-4">
                    <Link href={route('login')} className="text-sm text-ink-700 hover:text-ink-900">Log in</Link>
                    <Link href={route('register')} className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white">Sign up</Link>
                </div>
            </nav>
            {pageContent}
        </div>
    );
}
