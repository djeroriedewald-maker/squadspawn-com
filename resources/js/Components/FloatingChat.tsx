import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';

interface FriendItem {
    id: number;
    chat_id: string;
    partner: {
        id: number;
        name: string;
        username?: string;
        avatar?: string;
        online: boolean;
    };
    last_message: { body: string; sender_id: number; created_at: string } | null;
    unread_count: number;
}

interface Notification {
    id: string;
    data: {
        type: string;
        match_uuid?: string;
        partner_name?: string;
        partner_avatar?: string;
        sender_name?: string;
        sender_avatar?: string;
        message_preview?: string;
    };
    created_at: string;
}

interface ChatMessage {
    id: number;
    match_id: number;
    sender_id: number;
    body: string;
    read_at?: string;
    created_at: string;
    sender?: { id: number; name: string; profile?: { username?: string; avatar?: string } };
}

type View = 'closed' | 'list' | 'chat';
type Tab = 'chats' | 'notifications' | 'online';

export default function FloatingChat() {
    const { auth } = usePage().props as any;
    const userId = auth.user?.id;

    const [view, setView] = useState<View>('closed');
    const [tab, setTab] = useState<Tab>('chats');
    const [friends, setFriends] = useState<FriendItem[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>(auth.notifications || []);
    const [unreadCount, setUnreadCount] = useState(auth.unreadCount || 0);

    // Chat state
    const [activeChat, setActiveChat] = useState<FriendItem | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const lastTimestampRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    // Total badge count: unread messages + notifications
    const totalUnread = friends.reduce((sum, f) => sum + f.unread_count, 0) + unreadCount;

    // Fetch friends list
    const fetchFriends = useCallback(async () => {
        try {
            const { data } = await axios.get(route('chat.friends'));
            setFriends(data.friends);
        } catch {}
    }, []);

    // Fetch notifications
    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await axios.get(route('notifications.poll'));
            setUnreadCount(data.unreadCount);
            setNotifications(data.notifications);
        } catch {}
    }, []);

    // Poll friends + notifications every 5 seconds when panel is open
    useEffect(() => {
        if (!userId) return;
        // Initial fetch
        fetchFriends();
        fetchNotifications();

        const interval = setInterval(() => {
            fetchFriends();
            fetchNotifications();
        }, 5000);
        return () => clearInterval(interval);
    }, [userId, fetchFriends, fetchNotifications]);

    // Poll messages when in chat view
    useEffect(() => {
        if (view !== 'chat' || !activeChat) return;

        const interval = setInterval(async () => {
            try {
                const params: Record<string, string> = {};
                if (lastTimestampRef.current) params.since = lastTimestampRef.current;
                const { data } = await axios.get(route('chat.poll', { playerMatch: activeChat.chat_id }), { params });
                const newMessages: ChatMessage[] = data.messages || [];
                if (newMessages.length > 0) {
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((m) => m.id));
                        const unique = newMessages.filter((m) => !existingIds.has(m.id));
                        return unique.length > 0 ? [...prev, ...unique] : prev;
                    });
                    lastTimestampRef.current = data.timestamp;
                }
            } catch {}
        }, 2000);
        return () => clearInterval(interval);
    }, [view, activeChat]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Open a chat
    const openChat = useCallback(async (friend: FriendItem) => {
        setActiveChat(friend);
        setView('chat');
        setLoadingMessages(true);
        setMessages([]);
        lastTimestampRef.current = null;

        try {
            const { data } = await axios.get(route('chat.messages', { playerMatch: friend.chat_id }));
            setMessages(data.messages);
            lastTimestampRef.current = data.timestamp;
            // Clear unread for this friend locally
            setFriends((prev) =>
                prev.map((f) => (f.id === friend.id ? { ...f, unread_count: 0 } : f)),
            );
        } catch {}
        setLoadingMessages(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, []);

    // Send message
    const handleSend = useCallback(async (e?: FormEvent) => {
        e?.preventDefault();
        const body = textareaRef.current?.value?.trim();
        if (!body || sending || !activeChat) return;

        const inputValue = body;
        if (textareaRef.current) textareaRef.current.value = '';
        setSending(true);

        try {
            const { data } = await axios.post(route('chat.store', { playerMatch: activeChat.chat_id }), { body: inputValue });
            setMessages((prev) => [...prev, data]);
            if (data.created_at) lastTimestampRef.current = data.created_at;
            // Update last message in friends list
            setFriends((prev) =>
                prev.map((f) =>
                    f.id === activeChat.id
                        ? { ...f, last_message: { body: inputValue, sender_id: userId, created_at: 'Just now' } }
                        : f,
                ),
            );
        } catch {
            if (textareaRef.current) textareaRef.current.value = inputValue;
        }
        setSending(false);
    }, [sending, activeChat, userId]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Notification click
    const handleNotificationClick = useCallback(async (notif: Notification) => {
        try {
            await axios.post(route('notifications.markRead', { id: notif.id }));
            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {}

        if (notif.data.match_uuid) {
            // Find the friend and open chat
            const friend = friends.find((f) => f.chat_id === notif.data.match_uuid);
            if (friend) {
                openChat(friend);
                return;
            }
        }
        // Fallback: navigate
        setView('closed');
        router.visit(route('friends.index'));
    }, [friends, openChat]);

    const handleMarkAllRead = useCallback(async () => {
        try {
            await axios.post(route('notifications.readAll'));
            setNotifications([]);
            setUnreadCount(0);
        } catch {}
    }, []);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const onlineFriends = friends.filter((f) => f.partner.online);

    if (!userId) return null;

    // Floating button (closed state)
    if (view === 'closed') {
        return (
            <button
                onClick={() => setView('list')}
                className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gaming-purple shadow-lg shadow-gaming-purple/30 transition-transform hover:scale-110 active:scale-95 sm:h-14 sm:w-14"
            >
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                {totalUnread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gaming-pink text-[10px] font-bold text-white animate-pulse">
                        {totalUnread > 9 ? '9+' : totalUnread}
                    </span>
                )}
            </button>
        );
    }

    return (
        <>
            {/* Backdrop on mobile */}
            <div
                className="fixed inset-0 z-40 bg-black/50 sm:hidden"
                onClick={() => setView('closed')}
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className="fixed z-50 flex flex-col overflow-hidden border-white/10 bg-navy-800 shadow-2xl shadow-glow-purple
                    inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[540px] sm:w-[380px] sm:rounded-2xl sm:border"
            >
                {/* Header */}
                {view === 'list' && (
                    <>
                        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                            <h2 className="text-base font-bold text-white">Messages</h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.visit(route('friends.index'))}
                                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-navy-700 hover:text-white"
                                    title="Open full view"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setView('closed')}
                                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-navy-700 hover:text-white"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10">
                            {([
                                ['chats', 'Chats', friends.reduce((s, f) => s + f.unread_count, 0)],
                                ['notifications', 'Alerts', unreadCount],
                                ['online', 'Online', onlineFriends.length],
                            ] as [Tab, string, number][]).map(([key, label, count]) => (
                                <button
                                    key={key}
                                    onClick={() => setTab(key)}
                                    className={`flex-1 py-2.5 text-center text-xs font-semibold transition ${
                                        tab === key
                                            ? 'border-b-2 border-gaming-purple text-gaming-purple'
                                            : 'text-gray-500 hover:text-gray-300'
                                    }`}
                                >
                                    {label}
                                    {count > 0 && (
                                        <span className={`ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-white ${
                                            key === 'online' ? 'bg-gaming-green' : 'bg-gaming-pink'
                                        }`}>
                                            {count > 9 ? '9+' : count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto">
                            {tab === 'chats' && (
                                friends.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gaming-purple/10">
                                            <svg className="h-8 w-8 text-gaming-purple/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-400">No friends yet</p>
                                        <button
                                            onClick={() => { setView('closed'); router.visit(route('discovery.index')); }}
                                            className="mt-3 rounded-lg bg-gaming-purple/20 px-4 py-1.5 text-xs font-semibold text-gaming-purple transition hover:bg-gaming-purple/30"
                                        >
                                            Find Players
                                        </button>
                                    </div>
                                ) : (
                                    friends.map((friend) => (
                                        <button
                                            key={friend.id}
                                            onClick={() => openChat(friend)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-navy-700 active:bg-navy-600"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-sm font-bold text-white">
                                                    {friend.partner.avatar ? (
                                                        <img src={friend.partner.avatar} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        (friend.partner.username?.[0] || friend.partner.name[0]).toUpperCase()
                                                    )}
                                                </div>
                                                {friend.partner.online && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy-800 bg-gaming-green" />
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className={`truncate text-sm ${friend.unread_count > 0 ? 'font-bold text-white' : 'font-medium text-gray-300'}`}>
                                                        {friend.partner.username || friend.partner.name}
                                                    </span>
                                                    {friend.last_message && (
                                                        <span className="ml-2 shrink-0 text-[10px] text-gray-600">{friend.last_message.created_at}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <p className={`truncate text-xs ${friend.unread_count > 0 ? 'text-gray-300' : 'text-gray-500'}`}>
                                                        {friend.last_message
                                                            ? (friend.last_message.sender_id === userId ? 'You: ' : '') + friend.last_message.body
                                                            : 'Say hi!'}
                                                    </p>
                                                    {friend.unread_count > 0 && (
                                                        <span className="ml-2 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-gaming-purple px-1.5 text-[10px] font-bold text-white">
                                                            {friend.unread_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )
                            )}

                            {tab === 'notifications' && (
                                notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                                        <svg className="mb-2 h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                        </svg>
                                        <p className="text-sm text-gray-500">All caught up!</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-end border-b border-white/5 px-4 py-2">
                                            <button onClick={handleMarkAllRead} className="text-[11px] text-gaming-purple hover:text-gaming-purple/80">
                                                Mark all read
                                            </button>
                                        </div>
                                        {notifications.map((notif) => (
                                            <button
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className="flex w-full items-center gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-navy-700 active:bg-navy-600"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-purple/20">
                                                    {notif.data.sender_avatar || notif.data.partner_avatar ? (
                                                        <img src={notif.data.sender_avatar || notif.data.partner_avatar} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-gaming-purple">
                                                            {(notif.data.sender_name || notif.data.partner_name || '?')[0].toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-white">
                                                        {notif.data.type === 'new_match' ? (
                                                            <>
                                                                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gaming-green" />
                                                                New friend: <strong>{notif.data.partner_name}</strong>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <strong>{notif.data.sender_name}</strong>
                                                                <span className="text-gray-400">: {notif.data.message_preview}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                    <p className="mt-0.5 text-[10px] text-gray-500">{notif.created_at}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                )
                            )}

                            {tab === 'online' && (
                                onlineFriends.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                                            <span className="h-3 w-3 rounded-full bg-gray-600" />
                                        </div>
                                        <p className="text-sm text-gray-500">No friends online</p>
                                    </div>
                                ) : (
                                    onlineFriends.map((friend) => (
                                        <button
                                            key={friend.id}
                                            onClick={() => openChat(friend)}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-navy-700 active:bg-navy-600"
                                        >
                                            <div className="relative shrink-0">
                                                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-sm font-bold text-white">
                                                    {friend.partner.avatar ? (
                                                        <img src={friend.partner.avatar} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        (friend.partner.username?.[0] || friend.partner.name[0]).toUpperCase()
                                                    )}
                                                </div>
                                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-navy-800 bg-gaming-green" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className="text-sm font-medium text-white">
                                                    {friend.partner.username || friend.partner.name}
                                                </span>
                                                <p className="text-[10px] text-gaming-green">Online now</p>
                                            </div>
                                            <span className="shrink-0 rounded-lg bg-gaming-green/10 px-3 py-1 text-[11px] font-semibold text-gaming-green">
                                                Chat
                                            </span>
                                        </button>
                                    ))
                                )
                            )}
                        </div>
                    </>
                )}

                {/* Chat view */}
                {view === 'chat' && activeChat && (
                    <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 border-b border-white/10 px-3 py-2.5">
                            <button
                                onClick={() => setView('list')}
                                className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-navy-700 hover:text-white"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            <div className="relative shrink-0">
                                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-gaming-purple/30 to-gaming-green/30 text-xs font-bold text-white">
                                    {activeChat.partner.avatar ? (
                                        <img src={activeChat.partner.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        (activeChat.partner.username?.[0] || activeChat.partner.name[0]).toUpperCase()
                                    )}
                                </div>
                                {activeChat.partner.online && (
                                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-navy-800 bg-gaming-green" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">
                                    {activeChat.partner.username || activeChat.partner.name}
                                </p>
                                <p className="text-[10px] text-gray-500">
                                    {activeChat.partner.online ? (
                                        <span className="text-gaming-green">Online</span>
                                    ) : 'Offline'}
                                </p>
                            </div>
                            <button
                                onClick={() => { setView('closed'); router.visit(route('chat.show', { playerMatch: activeChat.chat_id })); }}
                                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-navy-700 hover:text-white"
                                title="Open full chat"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setView('closed')}
                                className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-navy-700 hover:text-white"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-3 py-3">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gaming-purple border-t-transparent" />
                                </div>
                            ) : messages.length === 0 ? (
                                <p className="py-12 text-center text-xs text-gray-600">No messages yet. Say hello!</p>
                            ) : (
                                messages.map((msg, i) => {
                                    const isMe = msg.sender_id === userId;
                                    const prevMsg = i > 0 ? messages[i - 1] : null;
                                    const isFirstInGroup = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                                    return (
                                        <div key={msg.id} className={isFirstInGroup && i > 0 ? 'mt-2' : 'mt-0.5'}>
                                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                                                        isMe
                                                            ? 'bg-gaming-purple text-white'
                                                            : 'bg-navy-700 text-gray-200'
                                                    }`}
                                                >
                                                    <p className="text-[13px] leading-relaxed">{msg.body}</p>
                                                    <p className={`mt-0.5 text-right text-[9px] ${isMe ? 'text-white/40' : 'text-gray-600'}`}>
                                                        {formatTime(msg.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="border-t border-white/10 px-3 py-2">
                            <div className="flex items-end gap-2">
                                <textarea
                                    ref={textareaRef}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type a message..."
                                    rows={1}
                                    className="max-h-20 min-h-[36px] flex-1 resize-none rounded-xl border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-gaming-purple focus:outline-none focus:ring-0"
                                />
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gaming-purple text-white transition hover:bg-gaming-purple/80 disabled:opacity-50"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                    </svg>
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </>
    );
}
