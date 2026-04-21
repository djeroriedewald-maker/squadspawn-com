import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';

interface ModReport {
    id: number;
    reason: string;
    details?: string | null;
    status: string;
    created_at: string;
    reporter: { profile?: { username?: string }; name: string };
    reported: { profile?: { username?: string }; name: string };
    community_post?: { id: number; slug: string; title: string; game?: { name: string } | null } | null;
    post_comment?: { id: number; body: string; post?: { slug: string; title: string } | null; user?: { profile?: { username?: string }; name: string } | null } | null;
}

interface ModerationActionItem {
    id: number;
    action: string;
    target_type: string;
    target_id: number;
    reason?: string | null;
    created_at: string;
    moderator: { profile?: { username?: string }; name: string };
}

interface Props {
    reports: ModReport[];
    recentActions: ModerationActionItem[];
}

function timeAgo(dateStr: string): string {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

const actionLabel = (a: string) => ({
    hide_post: '🔒 Hid post',
    unhide_post: '↩️ Unhid post',
    lock_post: '🔒 Locked post',
    unlock_post: '🔓 Unlocked post',
    pin_post: '📌 Pinned post',
    unpin_post: '📍 Unpinned post',
    hide_comment: '🔒 Hid comment',
    unhide_comment: '↩️ Unhid comment',
}[a] ?? a);

export default function ModQueue({ reports, recentActions }: Props) {
    const resolve = (id: number, status: 'reviewed' | 'resolved') => {
        axios.post(route('admin.resolveReport', { report: id }), { status }).then(() => router.reload());
    };

    const quickHide = async (postId: number) => {
        const reason = window.prompt('Reason (optional):', '');
        if (reason === null) return;
        await axios.post(`/mod/posts/${postId}/hide`, { reason });
        router.reload();
    };

    const quickHideComment = async (commentId: number) => {
        const reason = window.prompt('Reason (optional):', '');
        if (reason === null) return;
        await axios.post(`/mod/comments/${commentId}/hide`, { reason });
        router.reload();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Mod Queue" />

            <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-ink-900">Mod Queue</h1>
                    <p className="mt-1 text-sm text-ink-500">Community posts and comments flagged by users.</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="space-y-3 lg:col-span-2">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-ink-500">Open reports · {reports.length}</h2>
                        {reports.length === 0 ? (
                            <div className="rounded-xl border border-ink-900/10 bg-white p-10 text-center text-sm text-ink-500">
                                Nothing to review. 🎉
                            </div>
                        ) : (
                            reports.map((r) => (
                                <div key={r.id} className="rounded-xl border border-ink-900/10 bg-white p-5">
                                    <div className="mb-3 flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-500">{r.reason}</span>
                                                <span className="text-[11px] text-ink-500">{timeAgo(r.created_at)}</span>
                                            </div>
                                            <p className="text-xs text-ink-500">
                                                Reported by {r.reporter?.profile?.username || r.reporter?.name}
                                                {' · '}
                                                Against {r.reported?.profile?.username || r.reported?.name}
                                            </p>
                                            {r.details && <p className="mt-2 rounded bg-bone-50 p-2 text-xs italic text-ink-700">"{r.details}"</p>}
                                        </div>
                                    </div>

                                    {r.community_post && (
                                        <div className="mb-3 rounded-lg border border-ink-900/5 bg-bone-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Community post</p>
                                            <Link href={`/community/${r.community_post.slug}`} className="mt-0.5 block text-sm font-semibold text-neon-red hover:underline">
                                                🎮 {r.community_post.title}
                                            </Link>
                                            {r.community_post.game && <p className="text-[11px] text-ink-500">{r.community_post.game.name}</p>}
                                        </div>
                                    )}

                                    {r.post_comment && (
                                        <div className="mb-3 rounded-lg border border-ink-900/5 bg-bone-50 p-3">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Comment</p>
                                            {r.post_comment.post && (
                                                <Link href={`/community/${r.post_comment.post.slug}`} className="mt-0.5 block text-xs font-semibold text-neon-red hover:underline">
                                                    on "{r.post_comment.post.title}"
                                                </Link>
                                            )}
                                            <p className="mt-1 text-sm italic text-ink-700 line-clamp-3">"{r.post_comment.body}"</p>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        {r.community_post && (
                                            <button onClick={() => quickHide(r.community_post!.id)} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20">
                                                Hide post
                                            </button>
                                        )}
                                        {r.post_comment && (
                                            <button onClick={() => quickHideComment(r.post_comment!.id)} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20">
                                                Hide comment
                                            </button>
                                        )}
                                        <button onClick={() => resolve(r.id, 'reviewed')} className="rounded-lg bg-gaming-cyan/10 px-3 py-1.5 text-xs font-semibold text-gaming-cyan hover:bg-gaming-cyan/20">
                                            Mark reviewed
                                        </button>
                                        <button onClick={() => resolve(r.id, 'resolved')} className="rounded-lg bg-gaming-green/10 px-3 py-1.5 text-xs font-semibold text-gaming-green hover:bg-gaming-green/20">
                                            Mark resolved
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div>
                        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-500">Recent mod actions</h2>
                        <div className="space-y-2 rounded-xl border border-ink-900/10 bg-white p-4 text-xs">
                            {recentActions.length === 0 ? (
                                <p className="text-ink-500">No actions yet.</p>
                            ) : (
                                recentActions.map((a) => (
                                    <div key={a.id} className="flex items-start gap-2 border-b border-ink-900/5 pb-2 last:border-0 last:pb-0">
                                        <div className="flex-1">
                                            <p className="font-medium text-ink-900">
                                                {a.moderator?.profile?.username || a.moderator?.name} · {actionLabel(a.action)}
                                            </p>
                                            {a.reason && <p className="mt-0.5 text-ink-500 italic">"{a.reason}"</p>}
                                            <p className="mt-0.5 text-[10px] text-ink-500">{timeAgo(a.created_at)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
