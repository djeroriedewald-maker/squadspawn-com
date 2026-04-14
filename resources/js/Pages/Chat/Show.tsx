import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Message, PageProps, User } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

interface MatchData {
    id: number;
    user_one_id: number;
    user_two_id: number;
}

export default function Show({
    match,
    partner,
    messages: initialMessages,
}: PageProps<{ match: MatchData; partner: User; messages: Message[] }>) {
    const { auth } = usePage().props as any;
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastTimestampRef = useRef<string | null>(
        initialMessages.length > 0
            ? initialMessages[initialMessages.length - 1].created_at
            : null,
    );

    // Determine if partner is online (active within last 15 minutes)
    const partnerUpdatedAt = (partner as any).updated_at;
    const isPartnerOnline = partnerUpdatedAt
        ? Date.now() - new Date(partnerUpdatedAt).getTime() < 15 * 60 * 1000
        : false;

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Mark messages as read on mount
    useEffect(() => {
        axios.post(route('chat.markRead', { playerMatch: match.id })).catch(() => {});
    }, [match.id]);

    // Efficient polling: only fetch new messages since last timestamp
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const params: Record<string, string> = {};
                if (lastTimestampRef.current) {
                    params.since = lastTimestampRef.current;
                }
                const response = await axios.get(route('chat.poll', { playerMatch: match.id }), { params });
                const newMessages: Message[] = response.data?.messages || [];
                if (newMessages.length > 0) {
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((m) => m.id));
                        const unique = newMessages.filter((m) => !existingIds.has(m.id));
                        return unique.length > 0 ? [...prev, ...unique] : prev;
                    });
                    lastTimestampRef.current = response.data.timestamp;
                }
            } catch {
                // ignore polling errors
            }
        }, 2000);
        return () => clearInterval(interval);
    }, [match.id]);

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
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
            const response = await axios.post(route('chat.store', { playerMatch: match.id }), { body });
            setMessages((prev) => [...prev, response.data]);
            // Update timestamp so polling skips this message
            if (response.data.created_at) {
                lastTimestampRef.current = response.data.created_at;
            }
            setBody('');
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
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

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Chat - ${partner.profile?.username || partner.name}`} />

            <div className="flex h-[calc(100vh-64px)] flex-col">
                {/* Chat header */}
                <div className="border-b border-white/10 bg-navy-800 px-6 py-4">
                    <div className="mx-auto flex max-w-3xl items-center gap-3">
                        <a
                            href={route('friends.index')}
                            className="mr-2 text-gray-400 transition hover:text-white"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                        </a>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 font-bold text-white">
                            {partner.profile?.username?.[0]?.toUpperCase() || partner.name[0]?.toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white">{partner.profile?.username || partner.name}</h3>
                                <span
                                    className={`inline-block h-2.5 w-2.5 rounded-full ${isPartnerOnline ? 'bg-gaming-green animate-pulse' : 'bg-gray-500'}`}
                                    title={isPartnerOnline ? 'Online' : 'Offline'}
                                />
                            </div>
                            <p className="text-xs text-gray-400">
                                {isPartnerOnline ? 'Online' : partner.profile?.region || 'Offline'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="mx-auto max-w-3xl">
                        {messages.length === 0 ? (
                            <p className="text-center text-sm text-gray-500">
                                No messages yet. Say hello!
                            </p>
                        ) : (
                            messages.map((msg, index) => {
                                const isMe = msg.sender_id === auth.user.id;
                                const prevMsg = index > 0 ? messages[index - 1] : null;
                                const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
                                const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;
                                const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                                // Show "Seen" on the last message sent by me that has read_at
                                const isLastSeenByMe =
                                    isMe &&
                                    msg.read_at &&
                                    (!nextMsg || nextMsg.sender_id !== auth.user.id || !nextMsg.read_at);

                                return (
                                    <div key={msg.id} className={isFirstInGroup && index > 0 ? 'mt-3' : 'mt-0.5'}>
                                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            {/* Partner avatar - only on first message in group */}
                                            {!isMe && (
                                                <div className="mr-2 flex w-8 flex-shrink-0 items-end">
                                                    {isLastInGroup ? (
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-xs font-bold text-white">
                                                            {partner.profile?.username?.[0]?.toUpperCase() || partner.name[0]?.toUpperCase()}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            )}
                                            <div
                                                className={`max-w-[75%] px-4 py-2 ${
                                                    isMe
                                                        ? 'bg-gaming-purple text-white'
                                                        : 'bg-navy-700 text-gray-200'
                                                } ${
                                                    isFirstInGroup && isLastInGroup
                                                        ? 'rounded-2xl'
                                                        : isFirstInGroup
                                                          ? isMe
                                                              ? 'rounded-2xl rounded-br-md'
                                                              : 'rounded-2xl rounded-bl-md'
                                                          : isLastInGroup
                                                            ? isMe
                                                                ? 'rounded-2xl rounded-tr-md'
                                                                : 'rounded-2xl rounded-tl-md'
                                                            : isMe
                                                              ? 'rounded-2xl rounded-r-md'
                                                              : 'rounded-2xl rounded-l-md'
                                                }`}
                                            >
                                                <p className="text-sm leading-relaxed">{msg.body}</p>
                                                <p className={`mt-0.5 text-right text-[10px] ${isMe ? 'text-white/50' : 'text-gray-500'}`}>
                                                    {formatTime(msg.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                        {/* Seen indicator */}
                                        {isLastSeenByMe && (
                                            <div className="mt-0.5 flex items-center justify-end gap-1 pr-1">
                                                <svg className="h-3.5 w-3.5 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                                <svg className="ml-[-10px] h-3.5 w-3.5 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                </svg>
                                                <span className="text-[10px] text-gaming-green">Seen</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input */}
                <div className="border-t border-white/10 bg-navy-800 px-4 py-4">
                    <form onSubmit={handleSend} className="mx-auto flex max-w-3xl items-end gap-3">
                        <textarea
                            ref={textareaRef}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            rows={1}
                            className="max-h-[150px] min-h-[44px] flex-1 resize-none rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-white placeholder-gray-500 focus:border-gaming-purple focus:ring-gaming-purple"
                        />
                        <button
                            type="submit"
                            disabled={sending || !body.trim()}
                            className="rounded-xl bg-gaming-purple px-6 py-3 font-semibold text-white transition hover:bg-gaming-purple/90 disabled:opacity-50"
                        >
                            Send
                        </button>
                    </form>
                    <p className="mx-auto mt-1.5 max-w-3xl text-[10px] text-gray-600">
                        Press Enter to send, Shift+Enter for new line
                    </p>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
