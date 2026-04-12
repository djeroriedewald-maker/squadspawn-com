import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Message, PageProps, User } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { FormEvent, useEffect, useRef, useState } from 'react';
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Poll for new messages every 5 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(route('chat.show', { playerMatch: match.id }), {
                    headers: { 'X-Inertia': 'true', 'X-Inertia-Version': '' },
                });
                if (response.data?.props?.messages) {
                    setMessages(response.data.props.messages);
                }
            } catch (e) {
                // ignore polling errors
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [match.id]);

    const handleSend = async (e: FormEvent) => {
        e.preventDefault();
        if (!body.trim() || sending) return;

        setSending(true);
        try {
            const response = await axios.post(route('chat.store', { playerMatch: match.id }), { body });
            setMessages((prev) => [...prev, response.data]);
            setBody('');
        } catch (e) {
            // ignore
        }
        setSending(false);
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
                            <h3 className="font-bold text-white">{partner.profile?.username || partner.name}</h3>
                            {partner.profile?.region && (
                                <p className="text-xs text-gray-400">{partner.profile.region}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-6">
                    <div className="mx-auto max-w-3xl space-y-3">
                        {messages.length === 0 ? (
                            <p className="text-center text-sm text-gray-500">
                                No messages yet. Say hello!
                            </p>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.sender_id === auth.user.id;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                                isMe
                                                    ? 'bg-gaming-purple text-white'
                                                    : 'bg-navy-700 text-gray-200'
                                            }`}
                                        >
                                            <p className="text-sm leading-relaxed">{msg.body}</p>
                                            <p className={`mt-1 text-right text-[10px] ${isMe ? 'text-white/50' : 'text-gray-500'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input */}
                <div className="border-t border-white/10 bg-navy-800 px-4 py-4">
                    <form onSubmit={handleSend} className="mx-auto flex max-w-3xl gap-3">
                        <input
                            type="text"
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 rounded-xl border border-white/10 bg-navy-900 px-4 py-3 text-white placeholder-gray-500 focus:border-gaming-purple focus:ring-gaming-purple"
                        />
                        <button
                            type="submit"
                            disabled={sending || !body.trim()}
                            className="rounded-xl bg-gaming-purple px-6 py-3 font-semibold text-white transition hover:bg-gaming-purple/90 disabled:opacity-50"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
