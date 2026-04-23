import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';

interface Creator {
    id: number;
    name: string;
    email: string;
    clips_count: number;
    created_at: string;
    profile?: {
        username: string;
        avatar?: string;
        is_creator?: boolean;
        featured_until?: string | null;
    };
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Props {
    creators: {
        data: Creator[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: { filter: string };
    counts: { all: number; featured: number; idle: number };
}

const TABS: { value: string; label: string; countKey: 'all' | 'featured' | 'idle' }[] = [
    { value: 'all', label: 'All creators', countKey: 'all' },
    { value: 'featured', label: '✨ Featured', countKey: 'featured' },
    { value: 'idle', label: 'Not featured', countKey: 'idle' },
];

function daysUntil(iso: string | null | undefined): number | null {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    return ms <= 0 ? 0 : Math.max(1, Math.ceil(ms / 86_400_000));
}

export default function AdminCreators({ creators, filters, counts }: Props) {
    const active = filters.filter || 'all';

    function quickFeature(creator: Creator, days: number) {
        const name = creator.profile?.username || creator.name;
        if (!confirm(`Feature "${name}" in the Creator Spotlight for ${days} day${days === 1 ? '' : 's'}?`)) return;
        axios.post(route('admin.setFeatured', { user: creator.id }), { duration_days: days })
            .then(() => router.reload({ only: ['creators', 'counts'] }))
            .catch((err) => alert(err.response?.data?.error || 'Failed.'));
    }

    function remove(creator: Creator) {
        const name = creator.profile?.username || creator.name;
        if (!confirm(`Remove "${name}" from the spotlight now?`)) return;
        axios.post(route('admin.setFeatured', { user: creator.id }), { duration_days: 0 })
            .then(() => router.reload({ only: ['creators', 'counts'] }))
            .catch((err) => alert(err.response?.data?.error || 'Failed.'));
    }

    return (
        <AdminLayout>
            <Head title="Admin — Creators" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-ink-900">Creators</h1>
                <p className="mt-1 text-sm text-ink-500">
                    Manage the Creator Spotlight roster. Featuring runs 1-90 days; slots auto-expire on their own.
                </p>
            </div>

            {/* Filter tabs */}
            <div className="mb-6 flex w-fit gap-1 rounded-lg border border-ink-900/10 bg-white dark:bg-bone-100 p-1">
                {TABS.map((tab) => (
                    <Link
                        key={tab.value}
                        href={route('admin.creators', tab.value === 'all' ? {} : { filter: tab.value })}
                        preserveState
                        className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                            active === tab.value
                                ? 'bg-neon-red text-white shadow-sm'
                                : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                        {tab.label} <span className="ml-1 opacity-70">({counts[tab.countKey]})</span>
                    </Link>
                ))}
            </div>

            {/* Empty state */}
            {creators.data.length === 0 && (
                <div className="rounded-xl border border-dashed border-ink-900/10 bg-bone-100/50 p-12 text-center text-sm text-ink-500">
                    {active === 'featured'
                        ? 'No creators are currently featured. Use "Feature 7d" on any creator row to get started.'
                        : active === 'idle'
                          ? 'Every creator is currently in the spotlight. Nothing idle.'
                          : 'No creators yet. Users can mark themselves as a creator in their profile settings.'}
                </div>
            )}

            {/* Table */}
            {creators.data.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-ink-900/5 text-xs text-gray-500">
                                    <th className="px-5 py-3 font-medium">Creator</th>
                                    <th className="px-5 py-3 font-medium">Clips</th>
                                    <th className="px-5 py-3 font-medium">Spotlight</th>
                                    <th className="px-5 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ink-900/5">
                                {creators.data.map((c) => {
                                    const days = daysUntil(c.profile?.featured_until);
                                    const isFeatured = days !== null && days > 0;
                                    const expiringSoon = isFeatured && days! <= 3;

                                    return (
                                        <tr key={c.id} className="text-ink-700">
                                            <td className="px-5 py-3">
                                                <Link
                                                    href={route('admin.users.show', { user: c.id })}
                                                    className="flex items-center gap-3 transition hover:text-neon-red"
                                                >
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-pink/20 text-xs font-bold text-gaming-pink">
                                                        {c.profile?.avatar ? (
                                                            <img src={c.profile.avatar} alt="" className="h-full w-full object-cover" />
                                                        ) : (
                                                            (c.profile?.username ?? c.name).charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-ink-900">{c.profile?.username ?? c.name}</p>
                                                        <p className="text-[11px] text-gray-500">{c.email}</p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={c.clips_count === 0 ? 'text-gray-500' : 'text-ink-700'}>
                                                    {c.clips_count}
                                                </span>
                                                {c.clips_count === 0 && (
                                                    <span className="ml-2 rounded-full bg-gaming-orange/10 px-2 py-0.5 text-[10px] font-bold text-gaming-orange" title="Can't spotlight a creator with no clips">
                                                        no clips
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {isFeatured ? (
                                                    <div>
                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${expiringSoon ? 'bg-gaming-orange/20 text-gaming-orange' : 'bg-gaming-green/20 text-gaming-green'}`}>
                                                            ✨ {days}d left
                                                        </span>
                                                        <p className="mt-0.5 text-[10px] text-gray-500">
                                                            until {c.profile?.featured_until ? new Date(c.profile.featured_until).toLocaleDateString() : '?'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => quickFeature(c, 7)}
                                                        disabled={c.clips_count === 0}
                                                        title={c.clips_count === 0 ? 'Creator needs at least one clip first' : 'Feature for 7 days'}
                                                        className="rounded-lg bg-gaming-pink/10 px-3 py-1.5 text-xs font-medium text-gaming-pink transition hover:bg-gaming-pink/20 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        Feature 7d
                                                    </button>
                                                    <button
                                                        onClick={() => quickFeature(c, 30)}
                                                        disabled={c.clips_count === 0}
                                                        title={c.clips_count === 0 ? 'Creator needs at least one clip first' : 'Feature for 30 days'}
                                                        className="rounded-lg bg-gaming-pink/10 px-3 py-1.5 text-xs font-medium text-gaming-pink transition hover:bg-gaming-pink/20 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        30d
                                                    </button>
                                                    {isFeatured && (
                                                        <button
                                                            onClick={() => remove(c)}
                                                            className="rounded-lg bg-ink-900/5 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:bg-ink-900/10"
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {creators.last_page > 1 && (
                        <div className="flex items-center justify-center gap-1 border-t border-ink-900/5 px-5 py-3">
                            {creators.links.map((link, i) => (
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
            )}
        </AdminLayout>
    );
}
