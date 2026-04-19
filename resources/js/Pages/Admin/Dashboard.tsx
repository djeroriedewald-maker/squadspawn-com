import AdminLayout from '@/Layouts/AdminLayout';
import { Head } from '@inertiajs/react';

interface Stats {
    totalUsers: number;
    usersWithProfile: number;
    usersToday: number;
    usersThisWeek: number;
    totalFriends: number;
    totalGames: number;
    activeLfg: number;
    totalPosts: number;
    pendingReports: number;
    onlineNow: number;
}

interface Report {
    id: number;
    reporter: { name: string; profile?: { username: string } };
    reported: { name: string; profile?: { username: string } };
    reason: string;
    status: string;
    created_at: string;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    profile?: { username: string };
    created_at: string;
}

interface Props {
    stats: Stats;
    recentReports: Report[];
    recentUsers: RecentUser[];
}

const statCards: { key: keyof Stats; label: string; color: string; icon: JSX.Element }[] = [
    {
        key: 'totalUsers',
        label: 'Total Users',
        color: 'text-neon-red',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    },
    {
        key: 'usersWithProfile',
        label: 'With Profile',
        color: 'text-gaming-green',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
        key: 'usersToday',
        label: 'New Today',
        color: 'text-gaming-cyan',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
        key: 'usersThisWeek',
        label: 'This Week',
        color: 'text-gaming-cyan',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
    },
    {
        key: 'totalFriends',
        label: 'Friend Pairs',
        color: 'text-gaming-pink',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>,
    },
    {
        key: 'totalGames',
        label: 'Games',
        color: 'text-neon-red',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0" /></svg>,
    },
    {
        key: 'activeLfg',
        label: 'Active LFG',
        color: 'text-gaming-green',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
    },
    {
        key: 'totalPosts',
        label: 'Community Posts',
        color: 'text-gaming-cyan',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
    },
    {
        key: 'pendingReports',
        label: 'Pending Reports',
        color: 'text-red-400',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
    },
    {
        key: 'onlineNow',
        label: 'Online Now',
        color: 'text-gaming-green',
        icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
    },
];

export default function Dashboard({ stats, recentReports, recentUsers }: Props) {
    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
                <p className="mt-1 text-sm text-ink-500">Platform overview and statistics</p>
            </div>

            {/* Stat Cards Grid - 2x5 */}
            <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
                {statCards.map((card) => {
                    const isPending = card.key === 'pendingReports' && stats[card.key] > 0;
                    return (
                        <div
                            key={card.key}
                            className={`card-gaming rounded-xl border p-4 ${
                                isPending
                                    ? 'border-red-500/40 bg-red-500/5 shadow-lg shadow-red-500/10'
                                    : 'border-ink-900/10 bg-white'
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                                        isPending ? 'bg-red-500/10' : 'bg-ink-900/5'
                                    } ${card.color}`}
                                >
                                    {card.icon}
                                </div>
                                <div>
                                    <p className={`text-2xl font-bold ${isPending ? 'text-red-400' : 'text-ink-900'}`}>
                                        {stats[card.key]}
                                    </p>
                                    <p className="text-xs text-gray-500">{card.label}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tables Row */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Reports */}
                <div className="rounded-xl border border-ink-900/10 bg-white p-5">
                    <h2 className="mb-4 text-lg font-bold text-ink-900">Recent Reports</h2>
                    {recentReports.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-500">No pending reports</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-ink-900/5 text-xs text-gray-500">
                                        <th className="pb-3 font-medium">Reporter</th>
                                        <th className="pb-3 font-medium">Reported</th>
                                        <th className="pb-3 font-medium">Reason</th>
                                        <th className="pb-3 font-medium">Date</th>
                                        <th className="pb-3 font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-900/5">
                                    {recentReports.map((report) => (
                                        <tr key={report.id} className="text-ink-700">
                                            <td className="py-2.5">{report.reporter?.profile?.username || report.reporter?.name}</td>
                                            <td className="py-2.5">{report.reported?.profile?.username || report.reported?.name}</td>
                                            <td className="py-2.5 text-ink-500">{report.reason}</td>
                                            <td className="py-2.5 text-gray-500">{new Date(report.created_at).toLocaleDateString()}</td>
                                            <td className="py-2.5">
                                                <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                                                    {report.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recent Users */}
                <div className="rounded-xl border border-ink-900/10 bg-white p-5">
                    <h2 className="mb-4 text-lg font-bold text-ink-900">Recent Users</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-ink-900/5 text-xs text-gray-500">
                                    <th className="pb-3 font-medium">Name</th>
                                    <th className="pb-3 font-medium">Email</th>
                                    <th className="pb-3 font-medium">Username</th>
                                    <th className="pb-3 font-medium">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-900/5">
                                {recentUsers.map((user) => (
                                    <tr key={user.id} className="text-ink-700">
                                        <td className="py-2.5 font-medium text-ink-900">{user.name}</td>
                                        <td className="py-2.5 text-ink-500">{user.email}</td>
                                        <td className="py-2.5 text-neon-red">{user.profile?.username || '--'}</td>
                                        <td className="py-2.5 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
