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

interface PendingRequest {
    id: number;
    user_id: number;
    message?: string;
    username: string;
    avatar?: string;
}

interface LfgGroupItem {
    id: number;
    slug: string;
    title: string;
    status: 'open' | 'full' | 'closed';
    game_name?: string;
    game_cover?: string;
    member_count: number;
    spots_needed: number;
    is_host: boolean;
    host: { name: string; username?: string; avatar?: string };
    last_message: { body: string; user_name: string; created_at: string } | null;
    unread_count: number;
    pending_requests?: PendingRequest[];
}

interface Notification {
    id: string;
    data: {
        type: string;
        match_uuid?: string;
        lfg_slug?: string;
        lfg_title?: string;
        game_name?: string;
        partner_name?: string;
        partner_avatar?: string;
        sender_name?: string;
        sender_avatar?: string;
        message_preview?: string;
        host_name?: string;
        host_avatar?: string;
        applicant_name?: string;
        applicant_avatar?: string;
    };
    created_at: string;
}

interface ChatMessage {
    id: number;
    sender_id?: number;
    user_id?: number;
    body: string;
    read_at?: string;
    created_at: string;
    sender?: { id: number; name: string; profile?: { username?: string; avatar?: string } };
    user?: { id: number; name: string; profile?: { username?: string; avatar?: string } };
}

type View = 'closed' | 'list' | 'chat' | 'group-chat';
type Tab = 'chats' | 'groups' | 'notifications' | 'online';

export default function FloatingChat() {
    const { auth } = usePage().props as any;
    const userId = auth.user?.id;

    const [view, setView] = useState<View>('closed');
    const [tab, setTab] = useState<Tab>('chats');
    const [friends, setFriends] = useState<FriendItem[]>([]);
    const [lfgGroups, setLfgGroups] = useState<LfgGroupItem[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>(auth.notifications || []);
    const [unreadCount, setUnreadCount] = useState(auth.unreadCount || 0);

    // Friend chat state
    const [activeChat, setActiveChat] = useState<FriendItem | null>(null);
    // LFG chat state
    const [activeLfgChat, setActiveLfgChat] = useState<LfgGroupItem | null>(null);

    // Shared chat state
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [sending, setSending] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const lastTimestampRef = useRef<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const friendUnread = friends.reduce((sum, f) => sum + f.unread_count, 0);
    const groupUnread = lfgGroups.reduce((sum, g) => sum + g.unread_count + (g.pending_requests?.length || 0), 0);
    const totalUnread = friendUnread + groupUnread + unreadCount;

    const onlineFriends = friends.filter((f) => f.partner.online);

    // ── Polling ──────────────────────────────────────────────────

    const fetchAll = useCallback(async () => {
        try {
            const [friendsRes, groupsRes, notifsRes] = await Promise.all([
                axios.get(route('chat.friends')),
                axios.get(route('chat.lfgGroups')),
                axios.get(route('notifications.poll')),
            ]);
            setFriends(friendsRes.data.friends);
            setLfgGroups(groupsRes.data.groups);
            setUnreadCount(notifsRes.data.unreadCount);
            setNotifications(notifsRes.data.notifications);
        } catch {}
    }, []);

    useEffect(() => {
        if (!userId) return;
        fetchAll();
        const interval = setInterval(fetchAll, 5000);
        return () => clearInterval(interval);
    }, [userId, fetchAll]);

    // Poll messages when in chat view
    useEffect(() => {
        if (view === 'chat' && activeChat) {
            const interval = setInterval(async () => {
                try {
                    const params: Record<string, string> = {};
                    if (lastTimestampRef.current) params.since = lastTimestampRef.current;
                    const { data } = await axios.get(route('chat.poll', { playerMatch: activeChat.chat_id }), { params });
                    const newMsgs: ChatMessage[] = data.messages || [];
                    if (newMsgs.length > 0) {
                        setMessages((prev) => {
                            const ids = new Set(prev.map((m) => m.id));
                            const unique = newMsgs.filter((m) => !ids.has(m.id));
                            return unique.length > 0 ? [...prev, ...unique] : prev;
                        });
                        lastTimestampRef.current = data.timestamp;
                    }
                } catch {}
            }, 2000);
            return () => clearInterval(interval);
        }
        if (view === 'group-chat' && activeLfgChat) {
            const interval = setInterval(async () => {
                try {
                    const params: Record<string, string> = {};
                    if (lastTimestampRef.current) params.since = lastTimestampRef.current;
                    const { data } = await axios.get(route('lfg.poll', { lfgPost: activeLfgChat.slug }), { params });
                    const newMsgs: ChatMessage[] = data.messages || [];
                    if (newMsgs.length > 0) {
                        setMessages((prev) => {
                            const ids = new Set(prev.map((m) => m.id));
                            const unique = newMsgs.filter((m) => !ids.has(m.id));
                            return unique.length > 0 ? [...prev, ...unique] : prev;
                        });
                        lastTimestampRef.current = data.timestamp;
                    }
                } catch {}
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [view, activeChat, activeLfgChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Actions ──────────────────────────────────────────────────

    const openFriendChat = useCallback(async (friend: FriendItem) => {
        setActiveChat(friend);
        setActiveLfgChat(null);
        setView('chat');
        setLoadingMessages(true);
        setMessages([]);
        lastTimestampRef.current = null;
        try {
            const { data } = await axios.get(route('chat.messages', { playerMatch: friend.chat_id }));
            setMessages(data.messages);
            lastTimestampRef.current = data.timestamp;
            setFriends((prev) => prev.map((f) => (f.id === friend.id ? { ...f, unread_count: 0 } : f)));
        } catch {}
        setLoadingMessages(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, []);

    const openLfgChat = useCallback(async (group: LfgGroupItem) => {
        setActiveLfgChat(group);
        setActiveChat(null);
        setView('group-chat');
        setLoadingMessages(true);
        setMessages([]);
        lastTimestampRef.current = null;
        try {
            const { data } = await axios.get(route('chat.lfgMessages', { lfgPost: group.slug }));
            setMessages(data.messages);
            lastTimestampRef.current = data.timestamp;
            setLfgGroups((prev) => prev.map((g) => (g.id === group.id ? { ...g, unread_count: 0 } : g)));
        } catch {}
        setLoadingMessages(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, []);

    const handleSend = useCallback(async (e?: FormEvent) => {
        e?.preventDefault();
        const body = textareaRef.current?.value?.trim();
        if (!body || sending) return;

        const inputValue = body;
        if (textareaRef.current) textareaRef.current.value = '';
        setSending(true);

        try {
            if (view === 'chat' && activeChat) {
                const { data } = await axios.post(route('chat.store', { playerMatch: activeChat.chat_id }), { body: inputValue });
                setMessages((prev) => [...prev, data]);
                if (data.created_at) lastTimestampRef.current = data.created_at;
            } else if (view === 'group-chat' && activeLfgChat) {
                const { data } = await axios.post(route('lfg.message', { lfgPost: activeLfgChat.slug }), { body: inputValue });
                setMessages((prev) => [...prev, data]);
                if (data.created_at) lastTimestampRef.current = data.created_at;
            }
        } catch {
            if (textareaRef.current) textareaRef.current.value = inputValue;
        }
        setSending(false);
    }, [sending, view, activeChat, activeLfgChat]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNotificationClick = useCallback(async (notif: Notification) => {
        try {
            await axios.post(route('notifications.markRead', { id: notif.id }));
            setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
            setUnreadCount((prev: number) => Math.max(0, prev - 1));
        } catch {}

        // LFG notifications: open LFG group chat if available
        if (notif.data.lfg_slug) {
            const group = lfgGroups.find((g) => g.slug === notif.data.lfg_slug);
            if (group) {
                openLfgChat(group);
                return;
            }
            // Navigate to full LFG page if group not in widget
            setView('closed');
            router.visit(route('lfg.show', { lfgPost: notif.data.lfg_slug }));
            return;
        }

        // Friend notifications
        if (notif.data.match_uuid) {
            const friend = friends.find((f) => f.chat_id === notif.data.match_uuid);
            if (friend) {
                openFriendChat(friend);
                return;
            }
        }
        setView('closed');
        router.visit(route('dashboard'));
    }, [friends, lfgGroups, openFriendChat, openLfgChat]);

    const handleMarkAllRead = useCallback(async () => {
        try {
            await axios.post(route('notifications.readAll'));
            setNotifications([]);
            setUnreadCount(0);
        } catch {}
    }, []);

    // LFG request accept/reject
    const handleAcceptRequest = useCallback(async (group: LfgGroupItem, requestId: number) => {
        try {
            await axios.post(route('lfg.accept', { lfgPost: group.slug, response: requestId }));
            // Remove from pending, update member count
            setLfgGroups((prev) => prev.map((g) => g.id === group.id ? {
                ...g,
                member_count: g.member_count + 1,
                pending_requests: g.pending_requests?.filter((r) => r.id !== requestId),
            } : g));
            if (activeLfgChat?.id === group.id) {
                setActiveLfgChat((prev) => prev ? {
                    ...prev,
                    member_count: prev.member_count + 1,
                    pending_requests: prev.pending_requests?.filter((r) => r.id !== requestId),
                } : prev);
            }
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Failed to accept.');
        }
    }, [activeLfgChat]);

    const handleRejectRequest = useCallback(async (group: LfgGroupItem, requestId: number) => {
        try {
            await axios.post(route('lfg.reject', { lfgPost: group.slug, response: requestId }));
            setLfgGroups((prev) => prev.map((g) => g.id === group.id ? {
                ...g,
                pending_requests: g.pending_requests?.filter((r) => r.id !== requestId),
            } : g));
            if (activeLfgChat?.id === group.id) {
                setActiveLfgChat((prev) => prev ? {
                    ...prev,
                    pending_requests: prev.pending_requests?.filter((r) => r.id !== requestId),
                } : prev);
            }
        } catch (err: any) {
            alert(err?.response?.data?.error || 'Failed to reject.');
        }
    }, [activeLfgChat]);

    const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const getMsgSender = (msg: ChatMessage) => msg.sender || msg.user;
    const getMsgSenderId = (msg: ChatMessage) => msg.sender_id || msg.user_id;

    if (!userId) return null;

    // ── Floating button ──────────────────────────────────────────

    if (view === 'closed') {
        return (
            <button
                onClick={() => setView('list')}
                className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-neon-red shadow-lg shadow-neon-red/30 transition-transform hover:scale-110 active:scale-95"
            >
                <svg className="h-6 w-6 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

    // ── Status badge helper ──────────────────────────────────────
    const statusColor = (s: string) => s === 'open' ? 'bg-gaming-green' : s === 'full' ? 'bg-yellow-500' : 'bg-gray-500';

    // ── Notification display helper ──────────────────────────────
    const renderNotifContent = (notif: Notification) => {
        const d = notif.data;
        switch (d.type) {
            case 'new_match':
                return <><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gaming-green" />New friend: <strong>{d.partner_name}</strong></>;
            case 'new_message':
                return <><strong>{d.sender_name}</strong><span className="text-ink-500">: {d.message_preview}</span></>;
            case 'lfg_accepted':
                return <><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gaming-green" />Accepted to <strong>{d.lfg_title}</strong></>;
            case 'lfg_request':
                return <><strong>{d.applicant_name}</strong><span className="text-ink-500"> wants to join {d.lfg_title}</span></>;
            case 'lfg_ended':
                return <><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-yellow-400" />Session ended: <strong>{d.lfg_title}</strong><span className="text-ink-500"> — rate your teammates!</span></>;
            default:
                return 'New notification';
        }
    };
    const getNotifAvatar = (notif: Notification) => notif.data.sender_avatar || notif.data.partner_avatar || notif.data.host_avatar || notif.data.applicant_avatar;
    const getNotifName = (notif: Notification) => notif.data.sender_name || notif.data.partner_name || notif.data.host_name || notif.data.applicant_name || '?';

    return (
        <>
            {/* Backdrop on mobile */}
            <div className="fixed inset-0 z-40 bg-black/50 sm:hidden" onClick={() => setView('closed')} />

            {/* Panel */}
            <div className="fixed z-50 flex flex-col overflow-hidden border-ink-900/10 bg-white shadow-2xl shadow-glow-red inset-0 sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[540px] sm:w-[380px] sm:rounded-2xl sm:border">

                {/* ── LIST VIEW ── */}
                {(view === 'list') && (
                    <>
                        <div className="flex items-center justify-between border-b border-ink-900/10 px-4 py-3">
                            <h2 className="text-base font-bold text-ink-900">Messages</h2>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setView('closed')} className="rounded-lg p-1.5 text-ink-500 transition hover:bg-bone-100 hover:text-ink-900">
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-ink-900/10">
                            {([
                                ['chats', 'Chats', friendUnread],
                                ['groups', 'Groups', groupUnread],
                                ['notifications', 'Alerts', unreadCount],
                                ['online', 'Online', onlineFriends.length],
                            ] as [Tab, string, number][]).map(([key, label, count]) => (
                                <button
                                    key={key}
                                    onClick={() => setTab(key)}
                                    className={`flex-1 py-2.5 text-center text-[11px] font-semibold transition ${
                                        tab === key ? 'border-b-2 border-neon-red text-neon-red' : 'text-gray-500 hover:text-ink-700'
                                    }`}
                                >
                                    {label}
                                    {count > 0 && (
                                        <span className={`ml-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold text-ink-900 ${key === 'online' ? 'bg-gaming-green' : 'bg-gaming-pink'}`}>
                                            {count > 9 ? '9+' : count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* CHATS TAB */}
                            {tab === 'chats' && (
                                friends.length === 0 ? (
                                    <EmptyState icon="friends" text="No friends yet" action="Find Players" onAction={() => { setView('closed'); router.visit(route('discovery.index')); }} />
                                ) : friends.map((friend) => (
                                    <button key={friend.id} onClick={() => openFriendChat(friend)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-bone-100 active:bg-bone-200">
                                        <AvatarWithStatus avatar={friend.partner.avatar} name={friend.partner.username || friend.partner.name} online={friend.partner.online} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`truncate text-sm ${friend.unread_count > 0 ? 'font-bold text-ink-900' : 'font-medium text-ink-700'}`}>
                                                    {friend.partner.username || friend.partner.name}
                                                </span>
                                                {friend.last_message && <span className="ml-2 shrink-0 text-[10px] text-gray-600">{friend.last_message.created_at}</span>}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className={`truncate text-xs ${friend.unread_count > 0 ? 'text-ink-700' : 'text-gray-500'}`}>
                                                    {friend.last_message ? (friend.last_message.sender_id === userId ? 'You: ' : '') + friend.last_message.body : 'Say hi!'}
                                                </p>
                                                {friend.unread_count > 0 && <UnreadBadge count={friend.unread_count} />}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}

                            {/* GROUPS TAB */}
                            {tab === 'groups' && (
                                lfgGroups.length === 0 ? (
                                    <EmptyState icon="groups" text="No active groups" action="Browse LFG" onAction={() => { setView('closed'); router.visit(route('lfg.index')); }} />
                                ) : lfgGroups.map((group) => (
                                    <button key={group.id} onClick={() => openLfgChat(group)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-bone-100 active:bg-bone-200">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-bone-100">
                                            {group.game_cover ? (
                                                <img src={group.game_cover} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-[10px] font-bold text-neon-red">{(group.game_name || 'LFG')[0]}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className={`truncate text-sm ${group.unread_count > 0 ? 'font-bold text-ink-900' : 'font-medium text-ink-700'}`}>
                                                    {group.title}
                                                </span>
                                                <span className={`ml-2 h-2 w-2 shrink-0 rounded-full ${statusColor(group.status)}`} title={group.status} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-600">{group.game_name}</span>
                                                <span className="text-[10px] text-gray-700">·</span>
                                                <span className="text-[10px] text-gray-600">{group.member_count}/{group.spots_needed}</span>
                                                {group.pending_requests && group.pending_requests.length > 0 && (
                                                    <span className="rounded-full bg-yellow-400/20 px-1.5 py-0.5 text-[9px] font-bold text-yellow-400">
                                                        {group.pending_requests.length} pending
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className={`truncate text-xs ${group.unread_count > 0 ? 'text-ink-700' : 'text-gray-500'}`}>
                                                    {group.last_message ? `${group.last_message.user_name}: ${group.last_message.body}` : 'No messages yet'}
                                                </p>
                                                {group.unread_count > 0 && <UnreadBadge count={group.unread_count} />}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}

                            {/* NOTIFICATIONS TAB */}
                            {tab === 'notifications' && (
                                notifications.length === 0 ? (
                                    <EmptyState icon="bell" text="All caught up!" />
                                ) : (
                                    <>
                                        <div className="flex justify-end border-b border-ink-900/5 px-4 py-2">
                                            <button onClick={handleMarkAllRead} className="text-[11px] text-neon-red hover:text-neon-red/80">Mark all read</button>
                                        </div>
                                        {notifications.map((notif) => (
                                            <button key={notif.id} onClick={() => handleNotificationClick(notif)} className="flex w-full items-center gap-3 border-b border-ink-900/5 px-4 py-3 text-left transition hover:bg-bone-100 active:bg-bone-200">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20">
                                                    {getNotifAvatar(notif) ? (
                                                        <img src={getNotifAvatar(notif)!} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-xs font-bold text-neon-red">{getNotifName(notif)[0].toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-ink-900">{renderNotifContent(notif)}</p>
                                                    <p className="mt-0.5 text-[10px] text-gray-500">{notif.created_at}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                )
                            )}

                            {/* ONLINE TAB */}
                            {tab === 'online' && (
                                onlineFriends.length === 0 ? (
                                    <EmptyState icon="offline" text="No friends online" />
                                ) : onlineFriends.map((friend) => (
                                    <button key={friend.id} onClick={() => openFriendChat(friend)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-bone-100 active:bg-bone-200">
                                        <AvatarWithStatus avatar={friend.partner.avatar} name={friend.partner.username || friend.partner.name} online={true} />
                                        <div className="min-w-0 flex-1">
                                            <span className="text-sm font-medium text-ink-900">{friend.partner.username || friend.partner.name}</span>
                                            <p className="text-[10px] text-gaming-green">Online now</p>
                                        </div>
                                        <span className="shrink-0 rounded-lg bg-gaming-green/10 px-3 py-1 text-[11px] font-semibold text-gaming-green">Chat</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                )}

                {/* ── FRIEND CHAT VIEW ── */}
                {view === 'chat' && activeChat && (
                    <>
                        <ChatHeader
                            title={activeChat.partner.username || activeChat.partner.name}
                            subtitle={activeChat.partner.online ? 'Online' : 'Offline'}
                            subtitleColor={activeChat.partner.online ? 'text-gaming-green' : 'text-gray-500'}
                            avatar={activeChat.partner.avatar}
                            avatarName={activeChat.partner.username || activeChat.partner.name}
                            online={activeChat.partner.online}
                            onBack={() => setView('list')}
                            onExpand={() => { setView('closed'); router.visit(route('chat.show', { playerMatch: activeChat.chat_id })); }}
                            onClose={() => setView('closed')}
                        />
                        <MessageList messages={messages} loading={loadingMessages} userId={userId} isGroup={false} endRef={messagesEndRef} formatTime={formatTime} getMsgSender={getMsgSender} getMsgSenderId={getMsgSenderId} />
                        <ChatInput textareaRef={textareaRef} onSubmit={handleSend} onKeyDown={handleKeyDown} sending={sending} />
                    </>
                )}

                {/* ── LFG GROUP CHAT VIEW ── */}
                {view === 'group-chat' && activeLfgChat && (
                    <>
                        <ChatHeader
                            title={activeLfgChat.title}
                            subtitle={`${activeLfgChat.game_name} · ${activeLfgChat.member_count}/${activeLfgChat.spots_needed} players`}
                            subtitleColor="text-ink-500"
                            avatar={activeLfgChat.game_cover}
                            avatarName={activeLfgChat.game_name || 'LFG'}
                            isSquare
                            statusDot={statusColor(activeLfgChat.status)}
                            onBack={() => setView('list')}
                            onExpand={() => { setView('closed'); router.visit(route('lfg.show', { lfgPost: activeLfgChat.slug })); }}
                            onClose={() => setView('closed')}
                        />

                        {/* Pending requests banner (host only) */}
                        {activeLfgChat.is_host && activeLfgChat.pending_requests && activeLfgChat.pending_requests.length > 0 && (
                            <div className="border-b border-ink-900/10 bg-neon-red/5">
                                <div className="px-3 py-2">
                                    <p className="mb-2 text-[11px] font-semibold text-neon-red">
                                        {activeLfgChat.pending_requests.length} join {activeLfgChat.pending_requests.length === 1 ? 'request' : 'requests'}
                                    </p>
                                    <div className="space-y-2">
                                        {activeLfgChat.pending_requests.map((req) => (
                                            <div key={req.id} className="flex items-center gap-2 rounded-lg bg-white p-2">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20 text-[10px] font-bold text-neon-red">
                                                    {req.avatar ? <img src={req.avatar} alt="" className="h-full w-full object-cover" /> : req.username[0]?.toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-medium text-ink-900">{req.username}</p>
                                                    {req.message && <p className="truncate text-[10px] text-gray-500">{req.message}</p>}
                                                </div>
                                                <button
                                                    onClick={() => handleAcceptRequest(activeLfgChat, req.id)}
                                                    className="rounded-md bg-gaming-green/20 px-2.5 py-1 text-[10px] font-bold text-gaming-green transition hover:bg-gaming-green/30"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(activeLfgChat, req.id)}
                                                    className="rounded-md bg-red-500/20 px-2.5 py-1 text-[10px] font-bold text-red-400 transition hover:bg-red-500/30"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <MessageList messages={messages} loading={loadingMessages} userId={userId} isGroup={true} endRef={messagesEndRef} formatTime={formatTime} getMsgSender={getMsgSender} getMsgSenderId={getMsgSenderId} />
                        <ChatInput textareaRef={textareaRef} onSubmit={handleSend} onKeyDown={handleKeyDown} sending={sending} />
                    </>
                )}
            </div>
        </>
    );
}

// ── Sub-components ──────────────────────────────────────────────

function AvatarWithStatus({ avatar, name, online, size = 10 }: { avatar?: string; name: string; online?: boolean; size?: number }) {
    return (
        <div className="relative shrink-0">
            <div className={`flex h-${size} w-${size} items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-neon-red to-neon-red-deep text-sm font-bold text-white`}>
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : name[0]?.toUpperCase()}
            </div>
            {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-ink-800 bg-gaming-green" />}
        </div>
    );
}

function UnreadBadge({ count }: { count: number }) {
    return (
        <span className="ml-2 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-neon-red px-1.5 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
        </span>
    );
}

function EmptyState({ icon, text, action, onAction }: { icon: string; text: string; action?: string; onAction?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-bone-100/50">
                {icon === 'friends' && <svg className="h-7 w-7 text-neon-red/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
                {icon === 'groups' && <svg className="h-7 w-7 text-neon-red/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>}
                {icon === 'bell' && <svg className="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>}
                {icon === 'offline' && <span className="h-3 w-3 rounded-full bg-gray-600" />}
            </div>
            <p className="text-sm text-gray-500">{text}</p>
            {action && onAction && (
                <button onClick={onAction} className="mt-3 rounded-lg bg-neon-red/20 px-4 py-1.5 text-xs font-semibold text-neon-red transition hover:bg-neon-red/30">
                    {action}
                </button>
            )}
        </div>
    );
}

function ChatHeader({ title, subtitle, subtitleColor, avatar, avatarName, online, isSquare, statusDot, onBack, onExpand, onClose }: {
    title: string; subtitle: string; subtitleColor: string;
    avatar?: string; avatarName: string; online?: boolean; isSquare?: boolean; statusDot?: string;
    onBack: () => void; onExpand: () => void; onClose: () => void;
}) {
    return (
        <div className="flex items-center gap-2 border-b border-ink-900/10 px-3 py-2.5">
            <button onClick={onBack} className="shrink-0 rounded-lg p-1 text-ink-500 transition hover:bg-bone-100 hover:text-ink-900">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <div className="relative shrink-0">
                <div className={`flex h-8 w-8 items-center justify-center overflow-hidden ${isSquare ? 'rounded-lg' : 'rounded-full'} bg-gradient-to-br from-neon-red to-neon-red-deep text-xs font-bold text-white`}>
                    {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : avatarName[0]?.toUpperCase()}
                </div>
                {online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-800 bg-gaming-green" />}
                {statusDot && <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-800 ${statusDot}`} />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink-900">{title}</p>
                <p className={`text-[10px] ${subtitleColor}`}>{subtitle}</p>
            </div>
            <button onClick={onExpand} className="shrink-0 rounded-lg p-1.5 text-ink-500 transition hover:bg-bone-100 hover:text-ink-900" title="Open full view">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            </button>
            <button onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-ink-500 transition hover:bg-bone-100 hover:text-ink-900">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
            </button>
        </div>
    );
}

function MessageList({ messages, loading, userId, isGroup, endRef, formatTime, getMsgSender, getMsgSenderId }: {
    messages: ChatMessage[]; loading: boolean; userId: number; isGroup: boolean;
    endRef: React.RefObject<HTMLDivElement>;
    formatTime: (s: string) => string;
    getMsgSender: (m: ChatMessage) => ChatMessage['sender'];
    getMsgSenderId: (m: ChatMessage) => number | undefined;
}) {
    if (loading) {
        return <div className="flex flex-1 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-neon-red border-t-transparent" /></div>;
    }

    return (
        <div className="flex-1 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
                <p className="py-12 text-center text-xs text-gray-600">No messages yet. Say hello!</p>
            ) : (
                messages.map((msg, i) => {
                    const senderId = getMsgSenderId(msg);
                    const sender = getMsgSender(msg);
                    const isMe = senderId === userId;
                    const prevMsg = i > 0 ? messages[i - 1] : null;
                    const isFirstInGroup = !prevMsg || getMsgSenderId(prevMsg) !== senderId;

                    return (
                        <div key={msg.id} className={isFirstInGroup && i > 0 ? 'mt-2' : 'mt-0.5'}>
                            {/* Show sender name in group chats */}
                            {isGroup && !isMe && isFirstInGroup && sender && (
                                <p className="mb-0.5 ml-1 text-[10px] font-semibold text-neon-red">
                                    {sender.profile?.username || sender.name}
                                </p>
                            )}
                            <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                {/* Small avatar for group chat */}
                                {isGroup && !isMe && isFirstInGroup && (
                                    <div className="mr-1.5 flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bone-200 text-[9px] font-bold text-ink-900">
                                        {sender?.profile?.avatar ? (
                                            <img src={sender.profile.avatar} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            (sender?.profile?.username || sender?.name || '?')[0].toUpperCase()
                                        )}
                                    </div>
                                )}
                                {isGroup && !isMe && !isFirstInGroup && <div className="mr-1.5 w-6 shrink-0" />}
                                <div className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${isMe ? 'bg-neon-red text-white' : 'bg-bone-100 text-ink-800'}`}>
                                    <p className="text-[13px] leading-relaxed">{msg.body}</p>
                                    <p className={`mt-0.5 text-right text-[9px] ${isMe ? 'text-ink-900/40' : 'text-gray-600'}`}>{formatTime(msg.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
            <div ref={endRef} />
        </div>
    );
}

function ChatInput({ textareaRef, onSubmit, onKeyDown, sending }: {
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    onSubmit: (e?: FormEvent) => void;
    onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
    sending: boolean;
}) {
    return (
        <form onSubmit={onSubmit} className="border-t border-ink-900/10 px-3 py-2">
            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    onKeyDown={onKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="max-h-20 min-h-[36px] flex-1 resize-none rounded-xl border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 placeholder-gray-600 focus:border-neon-red focus:outline-none focus:ring-0"
                />
                <button type="submit" disabled={sending} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neon-red text-white transition hover:bg-neon-red/80 disabled:opacity-50">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
                </button>
            </div>
        </form>
    );
}
