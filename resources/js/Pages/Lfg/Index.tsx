import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game, PageProps, User } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

interface LfgResponse {
    id: number;
    user_id: number;
    message?: string;
    status: string;
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

export default function LfgIndex({
    posts,
    myPosts,
    games,
    filters,
}: {
    posts: { data: LfgPost[]; links: any };
    myPosts?: LfgPost[];
    games: Game[];
    filters: { game_id?: number; platform?: string };
}) {
    const { auth } = usePage<PageProps>().props;
    const [joiningId, setJoiningId] = useState<number | null>(null);
    const [localPosts, setLocalPosts] = useState<LfgPost[]>(posts.data);

    const handleFilter = (key: string, value: string) => {
        router.get(
            route('lfg.index'),
            { ...filters, [key]: value || undefined },
            { preserveState: true, replace: true },
        );
    };

    const handleJoin = async (postId: number) => {
        setJoiningId(postId);
        try {
            const { data } = await axios.post(route('lfg.respond', { lfgPost: postId }));
            setLocalPosts((prev) =>
                prev.map((p) =>
                    p.id === postId
                        ? {
                              ...p,
                              spots_filled: data.spots_filled,
                              status: data.status,
                              responses: [
                                  ...(p.responses || []),
                                  {
                                      id: Date.now(),
                                      user_id: auth.user.id,
                                      status: 'pending',
                                      user: auth.user,
                                  },
                              ],
                          }
                        : p,
                ),
            );
        } catch (err: any) {
            const msg = err.response?.data?.error || 'Failed to join.';
            alert(msg);
        } finally {
            setJoiningId(null);
        }
    };

    const formatScheduled = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const allPlatforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];

    const hasJoined = (post: LfgPost) =>
        post.responses?.some((r) => r.user_id === auth.user.id) ?? false;

    return (
        <AuthenticatedLayout>
            <Head title="Looking for Group" />

            <div className="py-6">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-2xl font-bold text-white">Looking for Group</h1>
                        <Link
                            href={route('lfg.create')}
                            className="inline-flex items-center gap-2 rounded-xl bg-gaming-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gaming-purple/80"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Create Post
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-2">
                        <select
                            value={filters.game_id ?? ''}
                            onChange={(e) => handleFilter('game_id', e.target.value)}
                            className="rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                        >
                            <option value="">All Games</option>
                            {games.map((game) => (
                                <option key={game.id} value={game.id}>
                                    {game.name}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filters.platform ?? ''}
                            onChange={(e) => handleFilter('platform', e.target.value)}
                            className="rounded-lg border border-white/10 bg-navy-800 px-3 py-2 text-sm text-white focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple"
                        >
                            <option value="">All Platforms</option>
                            {allPlatforms.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* My Groups */}
                    {myPosts && myPosts.length > 0 && (
                        <div className="mb-8">
                            <h2 className="mb-3 text-lg font-bold text-white">My Groups</h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {myPosts.map((mp) => (
                                    <Link
                                        key={mp.id}
                                        href={route('lfg.show', { lfgPost: mp.slug })}
                                        className="overflow-hidden rounded-xl border border-gaming-purple/30 bg-navy-800 transition hover:border-gaming-purple/50"
                                    >
                                        {mp.game && (
                                            <div className="relative h-[50px] overflow-hidden">
                                                <img
                                                    src={mp.game.cover_image || `/images/games/${mp.game.slug}.svg`}
                                                    alt={mp.game.name}
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-navy-800 to-transparent" />
                                                <span className="absolute bottom-1 left-3 text-xs font-semibold text-white drop-shadow">
                                                    {mp.game.name}
                                                </span>
                                            </div>
                                        )}
                                        <div className="p-3">
                                            <h3 className="mb-1.5 text-sm font-bold text-white line-clamp-1">{mp.title}</h3>
                                            <div className="mb-2 flex items-center justify-between text-xs">
                                                <span className="text-gray-400">{mp.spots_filled}/{mp.spots_needed} spots</span>
                                                <span className={`font-medium ${mp.status === 'full' ? 'text-red-400' : 'text-gaming-green'}`}>
                                                    {mp.status === 'full' ? 'Full' : 'Open'}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                <span className="rounded-full bg-gaming-purple/20 px-2 py-0.5 text-[10px] font-medium text-gaming-purple">{mp.platform}</span>
                                                {mp.mic_required && (
                                                    <span className="rounded-full bg-gaming-green/20 px-2 py-0.5 text-[10px] font-medium text-gaming-green">Mic</span>
                                                )}
                                                {mp.rank_min && (
                                                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">{mp.rank_min}</span>
                                                )}
                                                {mp.language && (
                                                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">{mp.language}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Posts Grid */}
                    {localPosts.length > 0 ? (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {localPosts.map((post) => {
                                const isFull = post.status === 'full';
                                const isOwn = post.user_id === auth.user.id;
                                const joined = hasJoined(post);
                                const progress =
                                    post.spots_needed > 0
                                        ? Math.min((post.spots_filled / post.spots_needed) * 100, 100)
                                        : 0;

                                return (
                                    <div
                                        key={post.id}
                                        className="overflow-hidden rounded-xl border border-white/10 bg-navy-800 transition hover:border-white/20 cursor-pointer"
                                        onClick={() => router.visit(route('lfg.show', { lfgPost: post.slug }))}
                                    >
                                        {/* Game banner */}
                                        {post.game && (
                                            <div className="relative h-[60px] overflow-hidden">
                                                <img
                                                    src={
                                                        post.game.cover_image ||
                                                        `/images/games/${post.game.slug}.svg`
                                                    }
                                                    alt={post.game.name}
                                                    className="h-full w-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-navy-800 to-transparent" />
                                                <span className="absolute bottom-1.5 left-3 text-xs font-semibold text-white drop-shadow">
                                                    {post.game.name}
                                                </span>
                                            </div>
                                        )}

                                        <div className="p-4">
                                            {/* Title */}
                                            <h3 className="mb-2 text-base font-bold text-white line-clamp-1">
                                                {post.title}
                                            </h3>

                                            {/* Poster */}
                                            <div className="mb-3 flex items-center gap-2">
                                                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-purple/20 text-xs font-bold text-gaming-purple">
                                                    {post.user?.profile?.avatar ? (
                                                        <img
                                                            src={post.user.profile.avatar}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        (
                                                            post.user?.profile?.username ??
                                                            post.user?.name ??
                                                            '?'
                                                        )
                                                            .charAt(0)
                                                            .toUpperCase()
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-400">
                                                    {post.user?.profile?.username ?? post.user?.name}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {post.description && (
                                                <p className="mb-3 text-xs leading-relaxed text-gray-400 line-clamp-2">
                                                    {post.description}
                                                </p>
                                            )}

                                            {/* Spots progress */}
                                            <div className="mb-3">
                                                <div className="mb-1 flex items-center justify-between text-xs">
                                                    <span className="text-gray-400">
                                                        {post.spots_filled}/{post.spots_needed} spots
                                                    </span>
                                                    <span
                                                        className={
                                                            isFull
                                                                ? 'font-medium text-red-400'
                                                                : 'font-medium text-gaming-green'
                                                        }
                                                    >
                                                        {isFull ? 'Full' : 'Open'}
                                                    </span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            isFull
                                                                ? 'bg-red-500'
                                                                : 'bg-gaming-green'
                                                        }`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Badges */}
                                            <div className="mb-3 flex flex-wrap gap-1.5">
                                                <span className="rounded-full bg-gaming-purple/20 px-2 py-0.5 text-[10px] font-medium text-gaming-purple">
                                                    {post.platform}
                                                </span>
                                                {post.rank_min && (
                                                    <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-medium text-yellow-400">
                                                        Min: {post.rank_min}
                                                    </span>
                                                )}
                                                {post.mic_required && (
                                                    <span className="rounded-full bg-gaming-green/20 px-2 py-0.5 text-[10px] font-medium text-gaming-green">
                                                        Mic
                                                    </span>
                                                )}
                                                {post.language && (
                                                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                                                        {post.language}
                                                    </span>
                                                )}
                                                {post.scheduled_at && (
                                                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                                                        {formatScheduled(post.scheduled_at)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Respondents */}
                                            {post.responses && post.responses.length > 0 && (
                                                <div className="mb-3 flex items-center gap-1">
                                                    <div className="flex -space-x-1.5">
                                                        {post.responses.slice(0, 5).map((resp) => (
                                                            <div
                                                                key={resp.id}
                                                                className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-navy-800 bg-gaming-purple/20 text-[9px] font-bold text-gaming-purple"
                                                            >
                                                                {resp.user?.profile?.avatar ? (
                                                                    <img
                                                                        src={resp.user.profile.avatar}
                                                                        alt=""
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    (
                                                                        resp.user?.profile?.username ??
                                                                        resp.user?.name ??
                                                                        '?'
                                                                    )
                                                                        .charAt(0)
                                                                        .toUpperCase()
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {post.responses.length > 5 && (
                                                        <span className="text-[10px] text-gray-500">
                                                            +{post.responses.length - 5}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Join button */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleJoin(post.id); }}
                                                disabled={isFull || isOwn || joined || joiningId === post.id}
                                                className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                                                    joined
                                                        ? 'bg-gaming-green/20 text-gaming-green cursor-default'
                                                        : isFull
                                                          ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                          : isOwn
                                                            ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                            : 'bg-gaming-green/10 text-gaming-green hover:bg-gaming-green/20 border border-gaming-green/30 hover:border-gaming-green/50'
                                                }`}
                                            >
                                                {joined
                                                    ? 'Joined'
                                                    : isFull
                                                      ? 'Full'
                                                      : isOwn
                                                        ? 'Your Post'
                                                        : joiningId === post.id
                                                          ? 'Joining...'
                                                          : 'Join'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-navy-800 p-12 text-center">
                            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gaming-purple/10">
                                <svg
                                    className="h-10 w-10 text-gaming-purple"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="mb-2 text-xl font-bold text-white">No LFG posts yet</h3>
                            <p className="mb-6 text-gray-400">
                                Be the first to create a Looking for Group post!
                            </p>
                            <Link
                                href={route('lfg.create')}
                                className="inline-flex rounded-xl bg-gaming-purple px-6 py-3 font-semibold text-white hover:bg-gaming-purple/80"
                            >
                                Create Post
                            </Link>
                        </div>
                    )}

                    {/* Pagination */}
                    {posts.links && posts.data.length > 0 && (
                        <div className="mt-6 flex justify-center gap-1">
                            {posts.links.map((link: any, i: number) => (
                                <Link
                                    key={i}
                                    href={link.url || '#'}
                                    className={`rounded-lg px-3 py-2 text-sm ${
                                        link.active
                                            ? 'bg-gaming-purple text-white'
                                            : link.url
                                              ? 'bg-navy-800 text-gray-400 hover:text-white'
                                              : 'bg-navy-800/50 text-gray-600 cursor-not-allowed'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
