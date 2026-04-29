import SeoHead from '@/Components/SeoHead';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useEffect, useState } from 'react';

interface PostComment {
    id: number;
    community_post_id: number;
    user_id: number;
    body: string;
    created_at: string;
    user?: User;
    hidden_at?: string | null;
    hidden_reason?: string | null;
    hidden_by?: { profile?: { username?: string }; name?: string } | null;
}

interface CommunityPost {
    id: number;
    slug: string;
    user_id: number;
    game_id: number | null;
    title: string;
    body: string;
    body_html?: string;
    type: 'discussion' | 'question' | 'tip' | 'team' | 'news';
    upvotes: number;
    downvotes: number;
    comments_count: number;
    created_at: string;
    user?: User;
    game?: Game;
    comments?: PostComment[];
    hidden_at?: string | null;
    hidden_reason?: string | null;
    hidden_by?: { profile?: { username?: string }; name?: string } | null;
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

export default function CommunityShow({
    post: initialPost,
    userVote: initialUserVote,
    canModerate = false,
}: {
    post: CommunityPost;
    userVote: number | null;
    canModerate?: boolean;
}) {
    const { auth } = usePage<PageProps>().props;
    const isLoggedIn = !!auth?.user;
    const canMod = canModerate || (auth?.canModerate ?? false);

    const [post, setPost] = useState(initialPost);
    const [userVote, setUserVote] = useState<number | null>(initialUserVote);
    const [comments, setComments] = useState<PostComment[]>(initialPost.comments || []);

    // router.reload() after mod actions delivers fresh props but the local
    // state hooks still hold the pre-action values. Mirror them forward so
    // hide / lock / pin toggles are reflected instantly.
    useEffect(() => {
        setPost(initialPost);
        setComments(initialPost.comments || []);
    }, [initialPost]);
    const [commentBody, setCommentBody] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [voting, setVoting] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const isLocked = !!post.locked_at;
    const isHidden = !!post.hidden_at;
    const isPinned = !!post.pinned_at;

    const modAction = async (url: string, reasonPrompt?: string) => {
        const reason = reasonPrompt ? (window.prompt(reasonPrompt, '') ?? null) : null;
        if (reasonPrompt && reason === null) return; // user cancelled
        try {
            await axios.post(url, reason ? { reason } : {});
            router.reload();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Mod action failed.';
            alert(`Mod action failed: ${msg} (${err.response?.status ?? 'network'})`);
        }
    };

    const score = post.upvotes - post.downvotes;

    const handleVote = async (vote: 1 | -1) => {
        if (!isLoggedIn || voting) return;
        setVoting(true);
        try {
            const { data } = await axios.post(route('community.vote', { communityPost: post.slug }), { vote });
            setPost((prev) => ({ ...prev, upvotes: data.upvotes, downvotes: data.downvotes }));
            setUserVote((prev) => (prev === vote ? null : vote));
        } catch {
            // ignore
        } finally {
            setVoting(false);
        }
    };

    const handleComment = async (e: FormEvent) => {
        e.preventDefault();
        if (!commentBody.trim() || submitting) return;
        setSubmitting(true);
        try {
            const { data } = await axios.post(route('community.comment', { communityPost: post.slug }), {
                body: commentBody,
            });
            setComments((prev) => [...prev, data]);
            setPost((prev) => ({ ...prev, comments_count: prev.comments_count + 1 }));
            setCommentBody('');
        } catch {
            // ignore
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm('Delete this comment?')) return;
        setDeletingId(commentId);
        try {
            await axios.delete(route('community.comment.destroy', { postComment: commentId }));
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            setPost((prev) => ({ ...prev, comments_count: Math.max(0, prev.comments_count - 1) }));
        } catch {
            // ignore
        } finally {
            setDeletingId(null);
        }
    };

    const jsonLd = (usePage().props as { jsonLd?: Record<string, unknown> }).jsonLd;

    const pageContent = (
        <>
            <SeoHead fallbackTitle={post.title} />
            {jsonLd && (
                <Head>
                    <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
                </Head>
            )}

            <div className="py-8">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Back link */}
                    <Link
                        href={route('community.index')}
                        className="mb-4 inline-flex items-center gap-1 text-sm text-ink-500 transition hover:text-ink-900"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Back to Community
                    </Link>

                    {/* Post */}
                    <div className="rounded-xl border border-ink-900/10 bg-white p-6">
                        <div className="flex gap-4">
                            {/* Vote column */}
                            <div className="flex flex-col items-center gap-0.5">
                                <button
                                    onClick={() => handleVote(1)}
                                    disabled={!isLoggedIn}
                                    className={`rounded p-1.5 transition ${
                                        userVote === 1
                                            ? 'text-gaming-green'
                                            : 'text-ink-500 hover:text-gaming-green'
                                    } ${!isLoggedIn ? 'cursor-default' : ''}`}
                                >
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <span className={`text-sm font-bold ${
                                    userVote === 1 ? 'text-gaming-green' : userVote === -1 ? 'text-red-400' : 'text-ink-500'
                                }`}>
                                    {score}
                                </span>
                                <button
                                    onClick={() => handleVote(-1)}
                                    disabled={!isLoggedIn}
                                    className={`rounded p-1.5 transition ${
                                        userVote === -1
                                            ? 'text-red-400'
                                            : 'text-ink-500 hover:text-red-400'
                                    } ${!isLoggedIn ? 'cursor-default' : ''}`}
                                >
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.55-.24l-3.25-3.5a.75.75 0 111.1-1.02L10 15.148l2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5A.75.75 0 0110 17z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            {/* Content */}
                            <div className="min-w-0 flex-1">
                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    {typeBadge(post.type)}
                                    {post.game && (
                                        <span className="flex items-center gap-1.5 rounded-full bg-ink-900/5 px-2.5 py-0.5 text-[10px] font-medium text-ink-700">
                                            {post.game.cover_image && (
                                                <img src={post.game.cover_image} alt="" className="h-4 w-4 rounded object-cover" />
                                            )}
                                            {post.game.name}
                                        </span>
                                    )}
                                </div>

                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {isPinned && (
                                            <span className="rounded-full bg-neon-red/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neon-red">
                                                📌 Pinned
                                            </span>
                                        )}
                                        {isLocked && (
                                            <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-600">
                                                🔒 Locked
                                            </span>
                                        )}
                                        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{post.title}</h1>
                                    </div>
                                    {auth?.user?.id === post.user_id && !isLocked && (
                                        <Link
                                            href={route('community.edit', post.slug)}
                                            className="shrink-0 rounded-lg border border-ink-900/10 px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:border-neon-red hover:text-neon-red"
                                        >
                                            Edit
                                        </Link>
                                    )}
                                </div>

                                {/* Hidden-by-mod banner — only mods/admins reach this page when hidden */}
                                {isHidden && canMod && (
                                    <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-xs">
                                        <p className="font-semibold text-red-500">This post is hidden from regular users.</p>
                                        {post.hidden_reason && <p className="mt-1 text-ink-500">Reason: {post.hidden_reason}</p>}
                                        {post.hidden_by && (
                                            <p className="mt-1 text-ink-500">Hidden by {post.hidden_by.profile?.username || post.hidden_by.name}</p>
                                        )}
                                    </div>
                                )}

                                {/* Mod action bar */}
                                {canMod && (
                                    <div className="mb-4 flex flex-wrap gap-2 rounded-lg border border-ink-900/10 bg-bone-50 p-2">
                                        <span className="px-1 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-500">Mod</span>
                                        {isHidden ? (
                                            <button type="button" onClick={() => modAction(`/mod/posts/${post.id}/unhide`)} className="rounded-lg bg-gaming-green/10 px-2.5 py-1 text-xs font-semibold text-gaming-green hover:bg-gaming-green/20">Unhide</button>
                                        ) : (
                                            <button type="button" onClick={() => modAction(`/mod/posts/${post.id}/hide`, 'Reason for hiding (optional):')} className="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500 hover:bg-red-500/20">Hide</button>
                                        )}
                                        {isLocked ? (
                                            <button type="button" onClick={() => modAction(`/mod/posts/${post.id}/unlock`)} className="rounded-lg bg-gaming-green/10 px-2.5 py-1 text-xs font-semibold text-gaming-green hover:bg-gaming-green/20">Unlock</button>
                                        ) : (
                                            <button type="button" onClick={() => modAction(`/mod/posts/${post.id}/lock`)} className="rounded-lg bg-yellow-400/10 px-2.5 py-1 text-xs font-semibold text-yellow-600 hover:bg-yellow-400/20">Lock</button>
                                        )}
                                        {isPinned ? (
                                            <button type="button" onClick={() => modAction(`/mod/posts/${post.id}/unpin`)} className="rounded-lg bg-ink-900/5 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-900/10">Unpin</button>
                                        ) : (
                                            <button type="button" onClick={() => modAction(`/mod/posts/${post.id}/pin`)} className="rounded-lg bg-neon-red/10 px-2.5 py-1 text-xs font-semibold text-neon-red hover:bg-neon-red/20">Pin</button>
                                        )}
                                    </div>
                                )}

                                <div className="mb-4 flex items-center gap-3 text-xs text-ink-500">
                                    <Link
                                        href={route('player.show', { username: post.user?.profile?.username || post.user?.id })}
                                        className="flex items-center gap-2 transition hover:text-ink-900"
                                    >
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20">
                                            {post.user?.profile?.avatar ? (
                                                <img src={post.user.profile.avatar} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-[9px] font-bold text-neon-red">
                                                    {(post.user?.profile?.username?.[0] || post.user?.name?.[0] || '?').toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-medium">{post.user?.profile?.username || post.user?.name}</span>
                                    </Link>
                                    <span>{timeAgo(post.created_at)}</span>
                                </div>

                                {post.body_html ? (
                                    <div
                                        className="prose-markdown max-w-none text-sm leading-relaxed text-ink-700"
                                        dangerouslySetInnerHTML={{ __html: post.body_html }}
                                    />
                                ) : (
                                    <div className="max-w-none whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-700">
                                        {post.body}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Comments section */}
                    <div className="mt-6">
                        <h2 className="mb-4 text-lg font-bold text-ink-900">
                            {post.comments_count} Comment{post.comments_count !== 1 ? 's' : ''}
                        </h2>

                        {/* Comment list */}
                        {comments.length > 0 ? (
                            <div className="space-y-3">
                                {comments.filter((c) => !c.hidden_at || canMod).map((comment) => {
                                    const commentHidden = !!comment.hidden_at;
                                    return (
                                    <div key={comment.id} className={`rounded-xl border p-4 ${commentHidden ? 'border-red-500/30 bg-red-500/5' : 'border-ink-900/5 bg-bone-100/50'}`}>
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={route('player.show', { username: comment.user?.profile?.username || comment.user?.id })}
                                                    className="flex items-center gap-2 transition hover:text-ink-900"
                                                >
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20">
                                                        {comment.user?.profile?.avatar ? (
                                                            <img src={comment.user.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <span className="text-[9px] font-bold text-neon-red">
                                                                {(comment.user?.profile?.username?.[0] || comment.user?.name?.[0] || '?').toUpperCase()}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-medium text-ink-900">
                                                        {comment.user?.profile?.username || comment.user?.name}
                                                    </span>
                                                </Link>
                                                <span className="text-[10px] text-ink-500">{timeAgo(comment.created_at)}</span>
                                                {commentHidden && (
                                                    <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-500">Hidden</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {canMod && (commentHidden ? (
                                                    <button onClick={() => modAction(`/mod/comments/${comment.id}/unhide`)} className="text-[11px] font-semibold text-gaming-green hover:underline">Unhide</button>
                                                ) : (
                                                    <button onClick={() => modAction(`/mod/comments/${comment.id}/hide`, 'Reason (optional):')} className="text-[11px] font-semibold text-red-500 hover:underline">Hide</button>
                                                ))}
                                                {isLoggedIn && comment.user_id === auth.user.id && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        disabled={deletingId === comment.id}
                                                        className="text-xs text-red-400 transition hover:text-red-300 disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm leading-relaxed text-ink-700 whitespace-pre-wrap break-words">{comment.body}</p>
                                        {commentHidden && canMod && comment.hidden_reason && (
                                            <p className="mt-2 text-[11px] text-red-500">Hidden reason: {comment.hidden_reason}</p>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-ink-900/5 bg-bone-100/50 p-8 text-center">
                                <p className="text-sm text-ink-500">No comments yet. Be the first to share your thoughts!</p>
                            </div>
                        )}

                        {/* Locked — no new comments */}
                        {isLocked && isLoggedIn && (
                            <div className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-4 text-center">
                                <p className="text-sm font-semibold text-yellow-600">🔒 This thread is locked</p>
                                <p className="mt-1 text-xs text-ink-500">A moderator froze replies. No new comments can be posted.</p>
                            </div>
                        )}

                        {/* Add comment form */}
                        {isLoggedIn && !isLocked ? (
                            <form onSubmit={handleComment} className="mt-4">
                                <textarea
                                    value={commentBody}
                                    onChange={(e) => setCommentBody(e.target.value)}
                                    placeholder="Write a comment..."
                                    maxLength={2000}
                                    rows={3}
                                    className="w-full rounded-xl border border-ink-900/10 bg-bone-50 px-4 py-3 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red resize-y"
                                />
                                <div className="mt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={submitting || !commentBody.trim()}
                                        className="rounded-lg bg-neon-red px-5 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/80 disabled:opacity-50"
                                    >
                                        {submitting ? 'Posting...' : 'Post Comment'}
                                    </button>
                                </div>
                            </form>
                        ) : !isLoggedIn && (
                            <div className="mt-4 rounded-xl border border-neon-red/20 bg-neon-red/5 p-4 text-center">
                                <p className="text-sm text-ink-500">
                                    <Link href={route('login')} className="font-semibold text-neon-red hover:text-neon-red/80">Log in</Link>
                                    {' '}or{' '}
                                    <Link href={route('register')} className="font-semibold text-neon-red hover:text-neon-red/80">sign up</Link>
                                    {' '}to join the discussion.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );

    if (isLoggedIn) {
        return (
            <AuthenticatedLayout>
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
