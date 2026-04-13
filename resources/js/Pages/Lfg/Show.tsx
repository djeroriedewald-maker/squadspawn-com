import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

interface LfgResponse {
    id: number;
    user_id: number;
    message?: string;
    status: string;
    user?: User;
}

interface LfgMessage {
    id: number;
    lfg_post_id: number;
    user_id: number;
    body: string;
    created_at: string;
    user?: User;
}

interface LfgPost {
    id: number;
    user_id: number;
    game_id: number;
    title: string;
    slug: string;
    description?: string;
    spots_needed: number;
    spots_filled: number;
    platform: string;
    rank_min?: string;
    mic_required?: boolean;
    language?: string;
    age_requirement?: string;
    requirements_note?: string;
    scheduled_at?: string;
    status: string;
    created_at: string;
    user?: User;
    game?: Game;
    responses?: LfgResponse[];
}

const TAGS = [
    { value: 'great_teammate', label: 'Great Teammate' },
    { value: 'good_comms', label: 'Good Comms' },
    { value: 'skilled', label: 'Skilled' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'toxic', label: 'Toxic' },
    { value: 'no_show', label: 'No Show' },
];

export default function LfgShow({
    post: initialPost,
    isMember,
    myRatings: initialMyRatings,
    messages: initialMessages,
}: {
    post: LfgPost;
    isMember: boolean;
    myRatings: number[];
    messages: LfgMessage[];
}) {
    const { auth } = usePage<PageProps>().props;
    const [post, setPost] = useState(initialPost);
    const [messages, setMessages] = useState<LfgMessage[]>(initialMessages);
    const [myRatings, setMyRatings] = useState<number[]>(initialMyRatings);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [joinMessage, setJoinMessage] = useState('');
    const [joining, setJoining] = useState(false);
    const [closing, setClosing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isCreator = post.user_id === auth.user.id;
    const isOpen = post.status === 'open';
    const isFull = post.status === 'full';
    const isClosed = post.status === 'closed';
    const canRate = isMember && (isClosed || isFull);

    const acceptedResponses = post.responses?.filter((r) => r.status === 'accepted') || [];
    const pendingResponses = post.responses?.filter((r) => r.status === 'pending') || [];
    const hasResponded = post.responses?.some((r) => r.user_id === auth.user.id) ?? false;

    const progress = post.spots_needed > 0 ? Math.min((post.spots_filled / post.spots_needed) * 100, 100) : 0;

    // Scroll to bottom of chat
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Poll for new messages every 3 seconds (only if member)
    useEffect(() => {
        if (!isMember) return;
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(route('lfg.show', { lfgPost: post.slug }), {
                    headers: { 'X-Inertia': 'true', 'X-Inertia-Version': '' },
                });
                if (response.data?.props?.messages) {
                    setMessages(response.data.props.messages);
                }
                if (response.data?.props?.post) {
                    setPost(response.data.props.post);
                }
            } catch {
                // ignore
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [post.id, isMember]);

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const ta = textareaRef.current;
        if (ta) {
            ta.style.height = 'auto';
            ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
        }
    }, []);

    useEffect(() => {
        adjustTextareaHeight();
    }, [body, adjustTextareaHeight]);

    const handleSend = async (e?: FormEvent) => {
        e?.preventDefault();
        if (!body.trim() || sending) return;
        setSending(true);
        try {
            const response = await axios.post(route('lfg.message', { lfgPost: post.slug }), { body });
            setMessages((prev) => [...prev, response.data]);
            setBody('');
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        } catch {
            // ignore
        }
        setSending(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleJoin = async () => {
        setJoining(true);
        try {
            await axios.post(route('lfg.respond', { lfgPost: post.slug }), { message: joinMessage || undefined });
            setPost((p) => ({
                ...p,
                responses: [
                    ...(p.responses || []),
                    { id: Date.now(), user_id: auth.user.id, status: 'pending', user: auth.user, message: joinMessage },
                ],
            }));
            setJoinMessage('');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to join.');
        } finally {
            setJoining(false);
        }
    };

    const handleAccept = async (responseId: number) => {
        try {
            const { data } = await axios.post(route('lfg.accept', { lfgPost: post.slug, response: responseId }));
            setPost((p) => ({
                ...p,
                status: data.status || p.status,
                spots_filled: p.spots_filled + 1,
                responses: p.responses?.map((r) => (r.id === responseId ? { ...r, status: 'accepted' } : r)),
            }));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to accept.');
        }
    };

    const handleReject = async (responseId: number) => {
        try {
            await axios.post(route('lfg.reject', { lfgPost: post.slug, response: responseId }));
            setPost((p) => ({
                ...p,
                responses: p.responses?.map((r) => (r.id === responseId ? { ...r, status: 'rejected' } : r)),
            }));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to reject.');
        }
    };

    const handleClose = async () => {
        if (!confirm('Close this group? Members can still rate each other.')) return;
        setClosing(true);
        try {
            await axios.post(route('lfg.close', { lfgPost: post.slug }));
            setPost((p) => ({ ...p, status: 'closed' }));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to close.');
        } finally {
            setClosing(false);
        }
    };

    const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const formatScheduled = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const statusBadge = () => {
        if (isClosed) return <span className="rounded-full bg-gray-500/20 px-3 py-1 text-xs font-medium text-gray-400">Closed</span>;
        if (isFull) return <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-medium text-red-400">Full</span>;
        return <span className="rounded-full bg-gaming-green/20 px-3 py-1 text-xs font-medium text-gaming-green">Open</span>;
    };

    const UserAvatar = ({ user, size = 'md' }: { user?: User; size?: 'sm' | 'md' | 'lg' }) => {
        const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-sm';
        return (
            <div className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-purple/20 font-bold text-gaming-purple`}>
                {user?.profile?.avatar ? (
                    <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                    (user?.profile?.username ?? user?.name ?? '?').charAt(0).toUpperCase()
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title={post.title} />

            <div className="py-6">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    {/* Back link */}
                    <Link
                        href={route('lfg.index')}
                        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                        Back to LFG
                    </Link>

                    {/* Header / Banner */}
                    <div className="relative mb-6 overflow-hidden rounded-2xl border border-white/10 bg-navy-800">
                        {post.game && (
                            <div className="relative h-36 overflow-hidden">
                                <img
                                    src={post.game.cover_image || `/images/games/${post.game.slug}.svg`}
                                    alt={post.game.name}
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-navy-800 via-navy-800/60 to-transparent" />
                            </div>
                        )}
                        <div className={`${post.game ? '-mt-12 relative' : ''} p-6`}>
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <div className="mb-2 flex items-center gap-2">
                                        {statusBadge()}
                                        {post.game && <span className="text-xs text-gray-400">{post.game.name}</span>}
                                    </div>
                                    <h1 className="text-2xl font-bold text-white">{post.title}</h1>
                                    {post.description && <p className="mt-2 text-sm text-gray-400">{post.description}</p>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <UserAvatar user={post.user} />
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            {post.user?.profile?.username ?? post.user?.name}
                                        </p>
                                        <p className="text-xs text-gray-500">Host</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left column */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Requirements */}
                            <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                                <h2 className="mb-4 text-lg font-bold text-white">Requirements</h2>

                                {/* Spots */}
                                <div className="mb-4">
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-gray-400">Spots</span>
                                        <span className="font-semibold text-white">{post.spots_filled}/{post.spots_needed}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                        <div
                                            className={`h-full rounded-full transition-all ${isFull || isClosed ? 'bg-red-500' : 'bg-gaming-green'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="flex items-center gap-3 rounded-lg bg-navy-900 p-3">
                                        <svg className="h-5 w-5 text-gaming-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></svg>
                                        <div>
                                            <p className="text-xs text-gray-500">Platform</p>
                                            <p className="text-sm font-medium text-white">{post.platform}</p>
                                        </div>
                                    </div>

                                    {post.rank_min && (
                                        <div className="flex items-center gap-3 rounded-lg bg-navy-900 p-3">
                                            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.853m0 0H11.25m0 0a6.023 6.023 0 01-2.77-.853" /></svg>
                                            <div>
                                                <p className="text-xs text-gray-500">Min Rank</p>
                                                <p className="text-sm font-medium text-white">{post.rank_min}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 rounded-lg bg-navy-900 p-3">
                                        {post.mic_required ? (
                                            <svg className="h-5 w-5 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" /></svg>
                                        )}
                                        <div>
                                            <p className="text-xs text-gray-500">Mic</p>
                                            <p className="text-sm font-medium text-white">{post.mic_required ? 'Required' : 'Not required'}</p>
                                        </div>
                                    </div>

                                    {post.language && (
                                        <div className="flex items-center gap-3 rounded-lg bg-navy-900 p-3">
                                            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" /></svg>
                                            <div>
                                                <p className="text-xs text-gray-500">Language</p>
                                                <p className="text-sm font-medium text-white">{post.language}</p>
                                            </div>
                                        </div>
                                    )}

                                    {post.age_requirement && post.age_requirement !== 'None' && (
                                        <div className="flex items-center gap-3 rounded-lg bg-navy-900 p-3">
                                            <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                            <div>
                                                <p className="text-xs text-gray-500">Age</p>
                                                <p className="text-sm font-medium text-white">{post.age_requirement}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {post.requirements_note && (
                                    <div className="mt-4 rounded-lg border border-white/5 bg-navy-900 p-3">
                                        <p className="mb-1 text-xs font-medium text-gray-500">Additional Requirements</p>
                                        <p className="text-sm text-gray-300">{post.requirements_note}</p>
                                    </div>
                                )}

                                {/* Schedule */}
                                {post.scheduled_at && (
                                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                                        <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                        <div>
                                            <p className="text-xs text-blue-400">Scheduled</p>
                                            <p className="text-sm font-medium text-white">{formatScheduled(post.scheduled_at)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Creator: Manage Requests */}
                            {isCreator && pendingResponses.length > 0 && (
                                <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                                    <h2 className="mb-4 text-lg font-bold text-white">
                                        Manage Requests
                                        <span className="ml-2 rounded-full bg-gaming-purple/20 px-2 py-0.5 text-xs text-gaming-purple">{pendingResponses.length}</span>
                                    </h2>
                                    <div className="space-y-3">
                                        {pendingResponses.map((resp) => (
                                            <div key={resp.id} className="flex items-center gap-3 rounded-lg bg-navy-900 p-3">
                                                <UserAvatar user={resp.user} size="sm" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-white">
                                                        {resp.user?.profile?.username ?? resp.user?.name}
                                                    </p>
                                                    {resp.message && (
                                                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{resp.message}</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleAccept(resp.id)}
                                                        className="rounded-lg bg-gaming-green/10 px-3 py-1.5 text-xs font-semibold text-gaming-green transition hover:bg-gaming-green/20"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(resp.id)}
                                                        className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Group Chat */}
                            {isMember && (
                                <div className="rounded-xl border border-white/10 bg-navy-800">
                                    <div className="border-b border-white/10 px-6 py-4">
                                        <h2 className="text-lg font-bold text-white">Group Chat</h2>
                                    </div>
                                    <div className="h-80 overflow-y-auto px-4 py-4">
                                        {messages.length === 0 ? (
                                            <p className="py-8 text-center text-sm text-gray-500">No messages yet. Say hello to your squad!</p>
                                        ) : (
                                            messages.map((msg) => {
                                                const isMe = msg.user_id === auth.user.id;
                                                return (
                                                    <div key={msg.id} className={`mb-3 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        {!isMe && (
                                                            <div className="mr-2 flex-shrink-0">
                                                                <UserAvatar user={msg.user} size="sm" />
                                                            </div>
                                                        )}
                                                        <div className={`max-w-[75%] ${isMe ? 'rounded-2xl rounded-br-md bg-gaming-purple' : 'rounded-2xl rounded-bl-md bg-navy-700'} px-4 py-2`}>
                                                            {!isMe && (
                                                                <p className="mb-0.5 text-xs font-medium text-gaming-purple">
                                                                    {msg.user?.profile?.username ?? msg.user?.name}
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-white">{msg.body}</p>
                                                            <p className={`mt-0.5 text-right text-[10px] ${isMe ? 'text-white/50' : 'text-gray-500'}`}>
                                                                {formatTime(msg.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="border-t border-white/10 px-4 py-3">
                                        <form onSubmit={handleSend} className="flex items-end gap-3">
                                            <textarea
                                                ref={textareaRef}
                                                value={body}
                                                onChange={(e) => setBody(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder="Type a message..."
                                                rows={1}
                                                className="max-h-[150px] min-h-[40px] flex-1 resize-none rounded-xl border border-white/10 bg-navy-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gaming-purple focus:ring-gaming-purple"
                                            />
                                            <button
                                                type="submit"
                                                disabled={sending || !body.trim()}
                                                className="rounded-xl bg-gaming-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gaming-purple/90 disabled:opacity-50"
                                            >
                                                Send
                                            </button>
                                        </form>
                                        <p className="mt-1 text-[10px] text-gray-600">Press Enter to send, Shift+Enter for new line</p>
                                    </div>
                                </div>
                            )}

                            {/* Rating Section */}
                            {canRate && (
                                <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                                    <h2 className="mb-4 text-lg font-bold text-white">Rate Your Teammates</h2>
                                    <div className="space-y-4">
                                        {/* Members to rate: host + accepted members, excluding self */}
                                        {[
                                            ...(post.user_id !== auth.user.id && post.user ? [post.user] : []),
                                            ...acceptedResponses.filter((r) => r.user_id !== auth.user.id && r.user).map((r) => r.user!),
                                        ].map((member) => (
                                            <RatingCard
                                                key={member.id}
                                                member={member}
                                                postId={post.id}
                                                alreadyRated={myRatings.includes(member.id)}
                                                onRated={(id) => setMyRatings((prev) => [...prev, id])}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right column - Sidebar */}
                        <div className="space-y-6">
                            {/* Join Section (not member, not creator) */}
                            {!isMember && !isCreator && isOpen && !hasResponded && (
                                <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                                    <h3 className="mb-3 text-base font-bold text-white">Join This Group</h3>
                                    <textarea
                                        value={joinMessage}
                                        onChange={(e) => setJoinMessage(e.target.value)}
                                        placeholder="Send a message to the host (optional)"
                                        className="mb-3 w-full resize-none rounded-lg border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                                        rows={3}
                                        maxLength={500}
                                    />
                                    <button
                                        onClick={handleJoin}
                                        disabled={joining}
                                        className="w-full rounded-xl bg-gaming-green/10 px-4 py-2.5 text-sm font-semibold text-gaming-green border border-gaming-green/30 transition hover:bg-gaming-green/20 hover:border-gaming-green/50 disabled:opacity-50"
                                    >
                                        {joining ? 'Joining...' : 'Request to Join'}
                                    </button>
                                </div>
                            )}

                            {/* Pending status */}
                            {!isMember && hasResponded && (
                                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-6 text-center">
                                    <svg className="mx-auto mb-2 h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-sm font-medium text-yellow-400">Request Pending</p>
                                    <p className="mt-1 text-xs text-gray-400">Waiting for the host to accept you.</p>
                                </div>
                            )}

                            {/* Creator actions */}
                            {isCreator && (
                                <div className="space-y-3 rounded-xl border border-white/10 bg-navy-800 p-6">
                                    <h3 className="text-base font-bold text-white">Group Actions</h3>
                                    {(isOpen || isFull) && (
                                        <Link
                                            href={route('lfg.edit', { lfgPost: post.slug })}
                                            className="block w-full rounded-lg bg-navy-700 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-navy-600"
                                        >
                                            Edit Post
                                        </Link>
                                    )}
                                    {(isOpen || isFull) && (
                                        <button
                                            onClick={handleClose}
                                            disabled={closing}
                                            className="w-full rounded-lg bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                                        >
                                            {closing ? 'Closing...' : 'Close Group'}
                                        </button>
                                    )}
                                    {isClosed && (
                                        <Link
                                            href={route('lfg.repost', { lfgPost: post.slug })}
                                            method="post"
                                            as="button"
                                            className="w-full rounded-lg bg-gaming-purple/10 px-4 py-2 text-sm font-semibold text-gaming-purple transition hover:bg-gaming-purple/20"
                                        >
                                            Play Again
                                        </Link>
                                    )}
                                </div>
                            )}

                            {/* Members list */}
                            {(isMember || isCreator) && (
                                <div className="rounded-xl border border-white/10 bg-navy-800 p-6">
                                    <h3 className="mb-3 text-base font-bold text-white">
                                        Members
                                        <span className="ml-2 text-sm font-normal text-gray-400">({acceptedResponses.length + 1})</span>
                                    </h3>
                                    <div className="space-y-2">
                                        {/* Host */}
                                        <div className="flex items-center gap-3 rounded-lg bg-navy-900 p-2.5">
                                            <UserAvatar user={post.user} size="sm" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-white">
                                                    {post.user?.profile?.username ?? post.user?.name}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-gaming-purple/20 px-2 py-0.5 text-[10px] font-medium text-gaming-purple">Host</span>
                                        </div>
                                        {/* Accepted members */}
                                        {acceptedResponses.map((resp) => (
                                            <div key={resp.id} className="flex items-center gap-3 rounded-lg bg-navy-900 p-2.5">
                                                <UserAvatar user={resp.user} size="sm" />
                                                <p className="min-w-0 flex-1 text-sm font-medium text-white">
                                                    {resp.user?.profile?.username ?? resp.user?.name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/* Rating Card Component */
function RatingCard({
    member,
    postId,
    alreadyRated,
    onRated,
}: {
    member: User;
    postId: number;
    alreadyRated: boolean;
    onRated: (id: number) => void;
}) {
    const [score, setScore] = useState(0);
    const [hoverScore, setHoverScore] = useState(0);
    const [tag, setTag] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(alreadyRated);

    const handleSubmit = async () => {
        if (score === 0 || submitting) return;
        setSubmitting(true);
        try {
            await axios.post(route('lfg.rate', { lfgPost: postId }), {
                rated_id: member.id,
                score,
                tag: tag || undefined,
            });
            setDone(true);
            onRated(member.id);
        } catch {
            alert('Failed to submit rating.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`rounded-lg border p-4 ${done ? 'border-white/5 bg-navy-900/50 opacity-60' : 'border-white/10 bg-navy-900'}`}>
            <div className="mb-3 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-purple/20 text-xs font-bold text-gaming-purple">
                    {member.profile?.avatar ? (
                        <img src={member.profile.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                        (member.profile?.username ?? member.name ?? '?').charAt(0).toUpperCase()
                    )}
                </div>
                <p className="text-sm font-medium text-white">{member.profile?.username ?? member.name}</p>
                {done && <span className="ml-auto text-xs text-gaming-green">Rated</span>}
            </div>

            {!done && (
                <>
                    {/* Stars */}
                    <div className="mb-3 flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setScore(s)}
                                onMouseEnter={() => setHoverScore(s)}
                                onMouseLeave={() => setHoverScore(0)}
                                className="p-0.5"
                            >
                                <svg
                                    className={`h-6 w-6 transition ${(hoverScore || score) >= s ? 'text-yellow-400' : 'text-gray-600'}`}
                                    fill={(hoverScore || score) >= s ? 'currentColor' : 'none'}
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                </svg>
                            </button>
                        ))}
                    </div>

                    {/* Tags */}
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {TAGS.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setTag(tag === t.value ? '' : t.value)}
                                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                                    tag === t.value
                                        ? t.value === 'toxic' || t.value === 'no_show'
                                            ? 'bg-red-500/20 text-red-400'
                                            : 'bg-gaming-green/20 text-gaming-green'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={score === 0 || submitting}
                        className="w-full rounded-lg bg-gaming-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-gaming-purple/80 disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Rating'}
                    </button>
                </>
            )}
        </div>
    );
}
