import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
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

    function handleBan(userId: number, userName: string) {
        if (!confirm(`Are you sure you want to ban "${userName}"? This will remove their profile and game associations.`)) {
            return;
        }
        axios.post(route('admin.ban', { user: userId })).then(() => {
            router.reload();
        });
    }

    return (
        <AdminLayout>
            <Head title="Admin - Users" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <p className="mt-1 text-sm text-gray-400">Manage platform users</p>
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
                        className="w-full rounded-lg border border-white/10 bg-navy-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-gaming-purple/50 focus:outline-none focus:ring-1 focus:ring-gaming-purple/50"
                    />
                </div>
                <button
                    type="submit"
                    className="rounded-lg bg-gaming-purple px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gaming-purple/80"
                >
                    Search
                </button>
            </form>

            {/* Users Table */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-navy-800">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/5 text-xs text-gray-500">
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
                        <tbody className="divide-y divide-white/5">
                            {users.data.map((user) => (
                                <tr key={user.id} className="text-gray-300 transition hover:bg-white/[0.02]">
                                    <td className="px-5 py-3 text-gray-500">#{user.id}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-purple/20 text-xs font-bold text-gaming-purple">
                                                {user.profile?.avatar ? (
                                                    <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <span className="font-medium text-white">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-gray-400">{user.email}</td>
                                    <td className="px-5 py-3 text-gaming-purple">{user.profile?.username || '--'}</td>
                                    <td className="px-5 py-3">{user.games_count}</td>
                                    <td className="px-5 py-3">{user.clips_count}</td>
                                    <td className="px-5 py-3 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="px-5 py-3">
                                        <button
                                            onClick={() => handleBan(user.id, user.name)}
                                            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                                        >
                                            Ban
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1 border-t border-white/5 px-5 py-4">
                        {users.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                                    link.active
                                        ? 'bg-gaming-purple text-white'
                                        : link.url
                                          ? 'text-gray-400 hover:bg-white/5 hover:text-white'
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
