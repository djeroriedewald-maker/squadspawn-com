import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    is_admin?: boolean;
    is_moderator?: boolean;
    is_owner?: boolean;
    games_count: number;
    clips_count: number;
    created_at: string;
    profile?: {
        username: string;
        avatar?: string;
    };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    users: {
        data: User[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
    };
}

export default function Users({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.get(route('admin.users'), { search: search || undefined }, { preserveState: true });
    }

    function handleBan(user: User) {
        const name = user.profile?.username || user.name;
        if (!confirm(`⚠️ Ban "${name}"?\n\nThis will:\n· Log them out of every device\n· Close all their active LFG groups\n· Prevent them from logging back in\n\nThis action is reversible through the user table (unban), but destructive in the moment.`)) {
            return;
        }
        axios.post(route('admin.ban', { user: user.id }))
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to ban user.'));
    }

    function toggleMod(user: User) {
        const grant = !user.is_moderator;
        const name = user.profile?.username || user.name;
        const msg = grant
            ? `Make "${name}" a moderator? They'll be able to hide / lock / pin community posts and comments.`
            : `Revoke moderator from "${name}"?`;
        if (!confirm(msg)) return;
        axios.post(route('admin.setModerator', { user: user.id }), { is_moderator: grant })
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to update moderator status.'));
    }

    function toggleAdmin(user: User) {
        const grant = !user.is_admin;
        const name = user.profile?.username || user.name;
        const msg = grant
            ? `⚠️ Promote "${name}" to ADMIN?\n\nAdmins have full platform access — user bans, role management, games, reports, and moderator powers. Only give this to people you fully trust.`
            : `Revoke admin from "${name}"? They'll lose all admin + moderator powers.`;
        if (!confirm(msg)) return;
        axios.post(route('admin.setAdmin', { user: user.id }), { is_admin: grant })
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to update admin status.'));
    }

    return (
        <AdminLayout>
            <Head title="Admin - Users" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-ink-900">Users</h1>
                <p className="mt-1 text-sm text-ink-500">Manage platform users</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6 flex gap-3">
                <div className="relative flex-1 max-w-md">
                    <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, or username..."
                        className="w-full rounded-lg border border-ink-900/10 bg-white dark:bg-bone-100 py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red/50 focus:outline-none focus:ring-1 focus:ring-neon-red/50"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-lg bg-neon-red px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neon-red/80"
                >
                    Search
                </button>
            </form>

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-ink-900/5 text-xs text-gray-500">
                                <th className="px-5 py-3 font-medium">ID</th>
                                <th className="px-5 py-3 font-medium">Name</th>
                                <th className="px-5 py-3 font-medium">Email</th>
                                <th className="px-5 py-3 font-medium">Username</th>
                                <th className="px-5 py-3 font-medium">Games</th>
                                <th className="px-5 py-3 font-medium">Clips</th>
                                <th className="px-5 py-3 font-medium">Joined</th>
                                <th className="px-5 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-900/5">
                            {users.data.map((user) => (
                                <tr key={user.id} className="text-ink-700 transition hover:bg-white/[0.02]">
                                    <td className="px-5 py-3 text-gray-500">#{user.id}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20 text-xs font-bold text-neon-red">
                                                {user.profile?.avatar ? (
                                                    <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="font-medium text-ink-900">{user.name}</span>
                                            {user.is_owner && (
                                                <span className="rounded-full bg-gaming-orange/20 px-2 py-0.5 text-[10px] font-bold text-gaming-orange" title="Platform owner — untouchable">👑 OWNER</span>
                                            )}
                                            {user.is_admin && !user.is_owner && (
                                                <span className="rounded-full bg-neon-red/20 px-2 py-0.5 text-[10px] font-bold text-neon-red">ADMIN</span>
                                            )}
                                            {!user.is_admin && user.is_moderator && (
                                                <span className="rounded-full bg-gaming-cyan/20 px-2 py-0.5 text-[10px] font-bold text-gaming-cyan">MOD</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-ink-500">{user.email}</td>
                                    <td className="px-5 py-3 text-neon-red">{user.profile?.username || '--'}</td>
                                    <td className="px-5 py-3">{user.games_count}</td>
                                    <td className="px-5 py-3">{user.clips_count}</td>
                                    <td className="px-5 py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="px-5 py-3">
                                        {user.is_owner ? (
                                            <span className="rounded-lg bg-gaming-orange/10 px-3 py-1.5 text-xs font-medium text-gaming-orange">Protected</span>
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {!user.is_admin && (
                                                    <button
                                                        onClick={() => toggleMod(user)}
                                                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${user.is_moderator ? 'bg-gaming-cyan/10 text-gaming-cyan hover:bg-gaming-cyan/20' : 'bg-ink-900/5 text-ink-700 hover:bg-ink-900/10'}`}
                                                    >
                                                        {user.is_moderator ? 'Revoke mod' : 'Make mod'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => toggleAdmin(user)}
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${user.is_admin ? 'bg-neon-red/10 text-neon-red hover:bg-neon-red/20' : 'bg-ink-900/5 text-ink-700 hover:bg-ink-900/10'}`}
                                                >
                                                    {user.is_admin ? 'Revoke admin' : 'Make admin'}
                                                </button>
                                                <button
                                                    onClick={() => handleBan(user)}
                                                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                                                >
                                                    Ban
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1 border-t border-ink-900/5 px-5 py-4">
                        {users.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                    link.active
                                        ? 'bg-neon-red text-white'
                                        : link.url
                                          ? 'text-ink-500 hover:bg-ink-900/5 hover:text-ink-900'
                                          : 'cursor-default text-gray-600'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                preserveState
                            />
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
