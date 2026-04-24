import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

interface SparkPoint { date: string; value: number; }

interface Attention {
    newMessages: number;
    pendingReports: number;
    plusSignupsWeek: number;
    creatorsWithoutClips: number;
}

interface Activity {
    signupsWeek: number;
    signupsPrevWeek: number;
    lfgWeek: number;
    lfgPrevWeek: number;
    postsWeek: number;
    postsPrevWeek: number;
    ratingsWeek: number;
    ratingsPrevWeek: number;
    pageViewsWeek: number;
    pageViewsPrevWeek: number;
}

interface State {
    totalUsers: number;
    usersWithProfile: number;
    totalFriends: number;
    totalGames: number;
    activeLfg: number;
    totalPosts: number;
    totalClips: number;
    totalRatings: number;
    onlineNow: number;
    plusWaitlistTotal: number;
    featuredCreators: number;
}

interface RecentMessage {
    id: number;
    subject: string;
    name: string;
    category: string;
    status: 'new' | 'read' | 'replied' | 'archived';
    created_at_human: string;
}

interface RecentReport {
    id: number;
    reporter: { name: string; profile?: { username: string } };
    reported: { name: string; profile?: { username: string } };
    lfg_post?: { id: number; slug: string; title: string; game?: { name: string } | null } | null;
    reason: string;
    status: string;
    created_at: string;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    profile?: { username: string; avatar?: string };
    created_at: string;
}

interface RecentPost {
    id: number;
    title: string;
    author: string;
    game?: string | null;
    created_at_human: string;
}

interface Changelog {
    version: string;
    title: string;
    slug: string;
    published_at_human: string;
}

interface Props {
    attention: Attention;
    activity: Activity;
    sparklines: { signups: SparkPoint[]; pageViews: SparkPoint[] };
    state: State;
    recentMessages: RecentMessage[];
    recentReports: RecentReport[];
    recentUsers: RecentUser[];
    recentPosts: RecentPost[];
    latestChangelog: Changelog | null;
}

// ── Helpers ───────────────────────────────────────────────────────

function deltaPct(curr: number, prev: number): number | null {
    if (prev === 0) return curr > 0 ? null : 0; // avoid "Infinity%"
    return Math.round(((curr - prev) / prev) * 100);
}

function Delta({ curr, prev }: { curr: number; prev: number }) {
    const pct = deltaPct(curr, prev);
    if (pct === null) return <span className="text-[11px] font-medium text-gaming-green">new this week</span>;
    const up = pct > 0;
    const flat = pct === 0;
    const tone = flat ? 'text-ink-500' : up ? 'text-gaming-green' : 'text-red-500';
    const arrow = flat ? '·' : up ? '▲' : '▼';
    return (
        <span className={`text-[11px] font-bold ${tone}`}>
            {arrow} {flat ? 'flat' : `${Math.abs(pct)}%`} <span className="font-normal text-ink-500">vs last week</span>
        </span>
    );
}

// Small inline sparkline — pure SVG, no library dep.
function Sparkline({ points, color = 'currentColor' }: { points: SparkPoint[]; color?: string }) {
    if (!points.length) return null;
    const values = points.map((p) => p.value);
    const max = Math.max(...values, 1);
    const w = 120;
    const h = 32;
    const step = w / Math.max(points.length - 1, 1);
    const path = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (p.value / max) * h}`)
        .join(' ');
    const lastX = (points.length - 1) * step;
    const lastY = h - (points[points.length - 1].value / max) * h;
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" preserveAspectRatio="none">
            <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
        </svg>
    );
}

const CATEGORY_TONE: Record<string, string> = {
    bug: 'bg-red-500/10 text-red-500',
    feature: 'bg-gaming-cyan/10 text-gaming-cyan',
    feedback: 'bg-gaming-green/10 text-gaming-green',
    press: 'bg-gaming-pink/10 text-gaming-pink',
    partnership: 'bg-gaming-orange/10 text-gaming-orange',
    creator: 'bg-gaming-pink/10 text-gaming-pink',
    privacy: 'bg-ink-900/10 text-ink-700',
    other: 'bg-ink-900/5 text-ink-500',
};

const MESSAGE_STATUS_TONE: Record<string, string> = {
    new: 'bg-neon-red/15 text-neon-red',
    read: 'bg-gaming-cyan/15 text-gaming-cyan',
    replied: 'bg-gaming-green/15 text-gaming-green',
    archived: 'bg-ink-900/10 text-ink-500',
};

// ── Attention card ────────────────────────────────────────────────
function AttentionCard({
    href, label, value, urgent, subtitle, color, icon,
}: {
    href: string;
    label: string;
    value: number;
    urgent: boolean;
    subtitle?: string;
    color: string;
    icon: JSX.Element;
}) {
    return (
        <Link
            href={href}
            className={`group relative overflow-hidden rounded-2xl border p-5 transition ${
                urgent
                    ? 'border-neon-red/40 bg-gradient-to-br from-neon-red/10 via-white to-white shadow-lg shadow-neon-red/10 dark:from-neon-red/20 dark:via-bone-100 dark:to-bone-100'
                    : 'border-ink-900/10 bg-white hover:border-ink-900/20 dark:bg-bone-100'
            }`}
        >
            {urgent && (
                <span className="absolute right-3 top-3 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-red opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-red" />
                </span>
            )}
            <div className="flex items-center gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
                    {icon}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500">{label}</p>
                    <p className="mt-0.5 text-3xl font-black leading-none text-ink-900">{value.toLocaleString()}</p>
                    {subtitle && <p className="mt-1 text-[11px] text-ink-500">{subtitle}</p>}
                </div>
                <svg className="h-4 w-4 shrink-0 text-ink-500 transition group-hover:translate-x-0.5 group-hover:text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                </svg>
            </div>
        </Link>
    );
}

// ── Activity card ────────────────────────────────────────────────
function ActivityCard({
    label, curr, prev, color, sparkline,
}: {
    label: string;
    curr: number;
    prev: number;
    color: string;
    sparkline?: SparkPoint[];
}) {
    return (
        <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm dark:bg-bone-100">
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500">{label}</p>
            <p className="mt-1 text-3xl font-black leading-none text-ink-900">{curr.toLocaleString()}</p>
            <div className="mt-2">
                <Delta curr={curr} prev={prev} />
            </div>
            {sparkline && (
                <div className={`mt-3 -mb-1 ${color}`}>
                    <Sparkline points={sparkline} />
                </div>
            )}
        </div>
    );
}

// ── Tiny state stat ──────────────────────────────────────────────
function StateStat({ label, value, color }: { label: string; value: number; color?: string }) {
    return (
        <div className="rounded-xl border border-ink-900/5 bg-white p-3 dark:bg-bone-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">{label}</p>
            <p className={`mt-0.5 text-xl font-bold ${color ?? 'text-ink-900'}`}>{value.toLocaleString()}</p>
        </div>
    );
}

// ── Panel ────────────────────────────────────────────────────────
function Panel({ title, href, linkLabel, children }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-ink-900/10 bg-white p-5 shadow-sm dark:bg-bone-100">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-ink-700">{title}</h2>
                {href && (
                    <Link href={href} className="text-xs font-semibold text-neon-red transition hover:text-neon-red/80">
                        {linkLabel ?? 'View all'} →
                    </Link>
                )}
            </div>
            {children}
        </div>
    );
}

// ── Dashboard ────────────────────────────────────────────────────
export default function Dashboard({
    attention, activity, sparklines, state, recentMessages, recentReports, recentUsers, recentPosts, latestChangelog,
}: Props) {
    return (
        <AdminLayout>
            <Head title="Mission Control · Admin" />

            {/* Header with live pulse */}
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="flex items-center gap-3 text-3xl font-black text-ink-900">
                        Mission Control
                        <span className="relative flex h-2.5 w-2.5" title="Platform online">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gaming-green opacity-75" />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gaming-green" />
                        </span>
                    </h1>
                    <p className="mt-1 text-sm text-ink-500">
                        {state.onlineNow.toLocaleString()} online · {state.totalUsers.toLocaleString()} total gamers · {state.activeLfg.toLocaleString()} active LFGs
                    </p>
                </div>
                {latestChangelog && (
                    <Link
                        href={route('changelog.show', { slug: latestChangelog.slug })}
                        className="group flex items-center gap-3 rounded-xl border border-ink-900/10 bg-white px-4 py-2.5 shadow-sm transition hover:border-neon-red/30 dark:bg-bone-100"
                    >
                        <span className="rounded-full bg-neon-red/15 px-2 py-0.5 text-[10px] font-bold text-neon-red">v{latestChangelog.version}</span>
                        <div className="text-xs">
                            <p className="font-semibold text-ink-900 leading-tight">{latestChangelog.title}</p>
                            <p className="text-ink-500">Shipped {latestChangelog.published_at_human}</p>
                        </div>
                    </Link>
                )}
            </div>

            {/* ── Attention row ───────────────────────────────── */}
            <section className="mb-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neon-red">Needs your attention</p>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <AttentionCard
                        href={route('admin.messages.index')}
                        label="Unread messages"
                        value={attention.newMessages}
                        urgent={attention.newMessages > 0}
                        subtitle={attention.newMessages > 0 ? 'Contact form inbox' : 'Inbox zero'}
                        color="bg-neon-red/10 text-neon-red"
                        icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>}
                    />
                    <AttentionCard
                        href="/admin/users?filter=reports"
                        label="Pending reports"
                        value={attention.pendingReports}
                        urgent={attention.pendingReports > 0}
                        subtitle={attention.pendingReports > 0 ? 'Moderation queue' : 'All clear'}
                        color="bg-red-500/10 text-red-500"
                        icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
                    />
                    <AttentionCard
                        href="/admin/waitlist"
                        label="Plus signups · 7d"
                        value={attention.plusSignupsWeek}
                        urgent={false}
                        subtitle={`${state.plusWaitlistTotal.toLocaleString()} total on waitlist`}
                        color="bg-gaming-pink/10 text-gaming-pink"
                        icon={<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.4 7.3h7.6l-6.2 4.5 2.4 7.3L12 16.6l-6.2 4.5 2.4-7.3L2 9.3h7.6L12 2z" /></svg>}
                    />
                    <AttentionCard
                        href={route('admin.creators')}
                        label="Creators · no clips"
                        value={attention.creatorsWithoutClips}
                        urgent={attention.creatorsWithoutClips > 5}
                        subtitle={`${state.featuredCreators} currently in Spotlight`}
                        color="bg-gaming-orange/10 text-gaming-orange"
                        icon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>}
                    />
                </div>
            </section>

            {/* ── Activity pulse row ──────────────────────────── */}
            <section className="mb-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gaming-cyan">Activity pulse · last 7 days</p>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <ActivityCard
                        label="New signups"
                        curr={activity.signupsWeek}
                        prev={activity.signupsPrevWeek}
                        color="text-gaming-cyan"
                        sparkline={sparklines.signups}
                    />
                    <ActivityCard
                        label="New LFGs"
                        curr={activity.lfgWeek}
                        prev={activity.lfgPrevWeek}
                        color="text-gaming-green"
                    />
                    <ActivityCard
                        label="Community posts"
                        curr={activity.postsWeek}
                        prev={activity.postsPrevWeek}
                        color="text-gaming-pink"
                    />
                    <ActivityCard
                        label="Ratings given"
                        curr={activity.ratingsWeek}
                        prev={activity.ratingsPrevWeek}
                        color="text-gaming-orange"
                    />
                    <ActivityCard
                        label="Page views"
                        curr={activity.pageViewsWeek}
                        prev={activity.pageViewsPrevWeek}
                        color="text-neon-red"
                        sparkline={sparklines.pageViews}
                    />
                </div>
            </section>

            {/* ── Current state strip ─────────────────────────── */}
            <section className="mb-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-500">Current state</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                    <StateStat label="Total users" value={state.totalUsers} color="text-ink-900" />
                    <StateStat label="With profile" value={state.usersWithProfile} color="text-gaming-green" />
                    <StateStat label="Online now" value={state.onlineNow} color="text-gaming-green" />
                    <StateStat label="Friend pairs" value={state.totalFriends} color="text-gaming-pink" />
                    <StateStat label="Games" value={state.totalGames} />
                    <StateStat label="Active LFGs" value={state.activeLfg} color="text-gaming-cyan" />
                    <StateStat label="Posts" value={state.totalPosts} />
                    <StateStat label="Total clips" value={state.totalClips} color="text-gaming-pink" />
                    <StateStat label="Ratings" value={state.totalRatings} color="text-gaming-orange" />
                    <StateStat label="Plus list" value={state.plusWaitlistTotal} color="text-neon-red" />
                    <StateStat label="In spotlight" value={state.featuredCreators} color="text-gaming-orange" />
                </div>
            </section>

            {/* ── Panels (2x2) ────────────────────────────────── */}
            <section className="grid gap-6 lg:grid-cols-2">
                {/* Recent messages */}
                <Panel title="Recent messages" href={route('admin.messages.index')}>
                    {recentMessages.length === 0 ? (
                        <p className="py-6 text-center text-sm text-ink-500">Inbox zero — no contact messages yet.</p>
                    ) : (
                        <ul className="divide-y divide-ink-900/5">
                            {recentMessages.map((m) => (
                                <li key={m.id}>
                                    <Link
                                        href={route('admin.messages.index')}
                                        className="flex items-center gap-3 py-2.5 transition hover:bg-bone-50 -mx-2 px-2 rounded-lg"
                                    >
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${MESSAGE_STATUS_TONE[m.status]}`}>
                                            {m.status}
                                        </span>
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CATEGORY_TONE[m.category] ?? CATEGORY_TONE.other}`}>
                                            {m.category}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-ink-900">{m.subject}</p>
                                            <p className="text-[11px] text-ink-500">From {m.name} · {m.created_at_human}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                {/* Recent users */}
                <Panel title="Newest gamers" href={route('admin.users')}>
                    {recentUsers.length === 0 ? (
                        <p className="py-6 text-center text-sm text-ink-500">No recent signups.</p>
                    ) : (
                        <ul className="divide-y divide-ink-900/5">
                            {recentUsers.map((u) => (
                                <li key={u.id}>
                                    <Link
                                        href={route('admin.users.show', { user: u.id })}
                                        className="flex items-center gap-3 py-2.5 transition hover:bg-bone-50 -mx-2 px-2 rounded-lg"
                                    >
                                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-bone-100">
                                            {u.profile?.avatar ? (
                                                <img src={u.profile.avatar} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs font-bold text-ink-500">
                                                    {(u.profile?.username || u.name).charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-ink-900">
                                                {u.profile?.username || u.name}
                                            </p>
                                            <p className="truncate text-[11px] text-ink-500">{u.email} · joined {new Date(u.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                {/* Pending reports */}
                <Panel title="Pending reports" href="/admin/users">
                    {recentReports.length === 0 ? (
                        <p className="py-6 text-center text-sm text-ink-500">All clear — no pending reports.</p>
                    ) : (
                        <ul className="divide-y divide-ink-900/5">
                            {recentReports.map((r) => (
                                <li key={r.id} className="py-2.5">
                                    <div className="flex items-center gap-3">
                                        <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-red-500">
                                            {r.status}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-ink-900">
                                                {r.reporter?.profile?.username || r.reporter?.name}
                                                <span className="mx-1.5 text-ink-500">→</span>
                                                <span className="text-red-500">{r.reported?.profile?.username || r.reported?.name}</span>
                                            </p>
                                            <p className="truncate text-[11px] text-ink-500">
                                                {r.reason}
                                                {r.lfg_post && <> · on “{r.lfg_post.title}”</>}
                                            </p>
                                        </div>
                                        <span className="shrink-0 text-[11px] text-ink-500">{new Date(r.created_at).toLocaleDateString()}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>

                {/* Recent posts */}
                <Panel title="Latest community posts" href="/community">
                    {recentPosts.length === 0 ? (
                        <p className="py-6 text-center text-sm text-ink-500">No community posts yet.</p>
                    ) : (
                        <ul className="divide-y divide-ink-900/5">
                            {recentPosts.map((p) => (
                                <li key={p.id}>
                                    <a
                                        href={`/community/${p.id}`}
                                        className="flex items-center gap-3 py-2.5 transition hover:bg-bone-50 -mx-2 px-2 rounded-lg"
                                    >
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gaming-pink/10 text-gaming-pink">
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" /></svg>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-ink-900">{p.title}</p>
                                            <p className="truncate text-[11px] text-ink-500">
                                                {p.author}
                                                {p.game && <> · {p.game}</>}
                                                {' · '}
                                                {p.created_at_human}
                                            </p>
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </Panel>
            </section>

            {/* ── Footer: quick links ─────────────────────────── */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3 border-t border-ink-900/5 pt-6 text-xs text-ink-500">
                <Link href="/admin/analytics" className="rounded-full border border-ink-900/10 bg-white px-3 py-1 font-medium transition hover:border-neon-red/30 hover:text-neon-red dark:bg-bone-100">
                    📊 Full analytics
                </Link>
                <Link href="/admin/broadcasts" className="rounded-full border border-ink-900/10 bg-white px-3 py-1 font-medium transition hover:border-neon-red/30 hover:text-neon-red dark:bg-bone-100">
                    📢 Broadcasts
                </Link>
                <Link href="/admin/system" className="rounded-full border border-ink-900/10 bg-white px-3 py-1 font-medium transition hover:border-neon-red/30 hover:text-neon-red dark:bg-bone-100">
                    ⚙ Feature flags
                </Link>
                <Link href={route('changelog.index')} className="rounded-full border border-ink-900/10 bg-white px-3 py-1 font-medium transition hover:border-neon-red/30 hover:text-neon-red dark:bg-bone-100">
                    📝 Changelog
                </Link>
            </div>
        </AdminLayout>
    );
}
