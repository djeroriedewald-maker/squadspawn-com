import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';

interface UserGame {
    id: number;
    name: string;
    rank: string | null;
    platform: string | null;
}

interface UserDetail {
    id: number;
    name: string;
    email: string;
    created_at: string;
    last_active: string;
    is_admin: boolean;
    is_moderator: boolean;
    is_owner: boolean;
    is_banned: boolean;
    is_og_founder?: boolean;
    plus_lifetime?: boolean;
    founder_number?: number | null;
    banned_at: string | null;
    ban_reason: string | null;
    referral_code: string | null;
    profile: {
        username: string;
        avatar?: string;
        bio?: string;
        region?: string;
        looking_for?: string;
        reputation_score?: number | string;
        level?: number;
        is_creator?: boolean;
        featured_until?: string | null;
        is_featured_now?: boolean;
    } | null;
    games: UserGame[];
    referred_by: { id: number; name: string } | null;
}

interface Invitee {
    id: number;
    name: string;
    created_at: string;
    is_banned: boolean;
    profile?: { username: string };
}

interface LfgRow {
    id: number;
    slug: string;
    title: string;
    status: string;
    created_at: string;
    game?: { id: number; name: string; cover_image?: string; slug: string };
}

interface ReportRow {
    id: number;
    reason: string;
    details?: string;
    status: string;
    created_at: string;
    reporter?: { id: number; name: string; profile?: { username: string } };
    reported?: { id: number; name: string; profile?: { username: string } };
}

interface AuditRow {
    id: number;
    action: string;
    metadata: Record<string, unknown> | null;
    created_at_human: string | null;
    created_at: string | null;
    actor: { id: number; name: string; is_owner: boolean } | null;
}

interface Props {
    user: UserDetail;
    stats: {
        friends: number;
        lfg_hosted: number;
        invitees: number;
        rating_count: number;
        reports_against: number;
        reports_filed: number;
    };
    invitees: Invitee[];
    recentLfg: LfgRow[];
    reportsAgainst: ReportRow[];
    reportsFiled: ReportRow[];
    auditTrail: AuditRow[];
}

const LFG_STATUS_TONE: Record<string, string> = {
    open: 'bg-gaming-green/15 text-gaming-green',
    full: 'bg-gaming-cyan/15 text-gaming-cyan',
    closed: 'bg-ink-900/10 text-ink-500',
};

const REPORT_STATUS_TONE: Record<string, string> = {
    pending: 'bg-gaming-orange/15 text-gaming-orange',
    resolved: 'bg-gaming-green/15 text-gaming-green',
    dismissed: 'bg-ink-900/10 text-ink-500',
};

function displayName(u: { profile?: { username?: string }; name: string } | null | undefined): string {
    if (!u) return '—';
    return u.profile?.username || u.name;
}

export default function UserShow({ user, stats, invitees, recentLfg, reportsAgainst, reportsFiled, auditTrail }: Props) {
    const name = user.profile?.username || user.name;
    const rep = user.profile?.reputation_score;
    const repDisplay = rep && Number(rep) > 0 ? Number(rep).toFixed(1) : '—';

    function handleBan() {
        if (!confirm(`⚠️ Ban "${name}"?\n\nThis will:\n· Log them out of every device\n· Close all their active LFG groups\n· Prevent them from logging back in\n\nYou can unban from this same page.`)) return;
        axios.post(route('admin.ban', { user: user.id }))
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to ban user.'));
    }

    function handleUnban() {
        if (!confirm(`Unban "${name}"? They'll be able to log in again.`)) return;
        axios.post(route('admin.unban', { user: user.id }))
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to unban user.'));
    }

    function toggleMod() {
        const grant = !user.is_moderator;
        const msg = grant
            ? `Make "${name}" a moderator? They'll be able to hide / lock / pin community posts and comments.`
            : `Revoke moderator from "${name}"?`;
        if (!confirm(msg)) return;
        axios.post(route('admin.setModerator', { user: user.id }), { is_moderator: grant })
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to update moderator status.'));
    }

    function toggleAdmin() {
        const grant = !user.is_admin;
        const msg = grant
            ? `⚠️ Promote "${name}" to ADMIN?\n\nAdmins have full platform access — user bans, role management, games, reports, and moderator powers. Only give this to people you fully trust.`
            : `Revoke admin from "${name}"? They'll lose all admin + moderator powers.`;
        if (!confirm(msg)) return;
        axios.post(route('admin.setAdmin', { user: user.id }), { is_admin: grant })
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to update admin status.'));
    }

    function toggleOgFounder() {
        const grant = !user.is_og_founder;
        const msg = grant
            ? `Mark "${name}" as OG FOUNDER?\n\nThey'll get the gold founder badge across the site + lifetime Plus access (auto-applies when Plus ships). Reserved for hand-picked seed users — friends, early supporters, the squad you personally brought in.`
            : `Revoke OG Founder from "${name}"? They lose the badge + lifetime Plus.`;
        if (!confirm(msg)) return;
        axios.post(route('admin.setOgFounder', { user: user.id }), { is_og_founder: grant })
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to update OG founder status.'));
    }

    function impersonate() {
        if (!confirm(`Log in as "${name}"?\nUse the red banner at the top to return.`)) return;
        router.post(route('admin.impersonate', { user: user.id }));
    }

    function killSwitch() {
        if (!confirm(`⚠️ KILL-SWITCH: "${name}"?\n\nThis is the emergency hammer:\n· Ban immediately\n· Invalidate remember-me across every device\n· Close all their active LFG groups\n· Log the event\n\nUse only for spam/abuse accounts that need to be gone right now.`)) return;
        const reason = prompt('Reason (optional, shown to the user):') ?? '';
        router.post(route('admin.system.kill', { user: user.id }), { reason }, { preserveScroll: true });
    }

    function setFeatured() {
        if (!user.profile?.is_creator) {
            alert('This profile isn\'t marked as a creator yet. Toggle is_creator in their profile first.');
            return;
        }
        const raw = prompt(
            `Feature "${name}" in the Creator Spotlight for how many days?\n` +
            `Enter a number 1-90. Enter 0 to remove from spotlight immediately.`,
            '7',
        );
        if (raw === null) return;
        const days = parseInt(raw, 10);
        if (isNaN(days) || days < 0 || days > 90) {
            alert('Enter a number between 0 and 90.');
            return;
        }
        axios.post(route('admin.setFeatured', { user: user.id }), { duration_days: days })
            .then(() => router.reload())
            .catch((err) => alert(err.response?.data?.error || 'Failed to update spotlight.'));
    }

    return (
        <AdminLayout>
            <Head title={`Admin — ${name}`} />

            <div className="mb-6 flex items-center gap-3 text-sm text-ink-500">
                <Link href={route('admin.users')} className="hover:text-ink-900">Users</Link>
                <span>/</span>
                <span className="text-ink-900">{name}</span>
            </div>

            {user.is_banned && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm font-semibold text-red-400">This account is banned.</p>
                    <p className="mt-1 text-xs text-red-400/80">
                        {user.ban_reason || 'No reason recorded.'}
                        {user.banned_at && <span className="ml-2 text-red-400/60">· {user.banned_at}</span>}
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="mb-6 rounded-2xl border border-ink-900/10 bg-white dark:bg-bone-100 p-6">
                <div className="flex flex-wrap items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20 text-xl font-bold text-neon-red">
                        {user.profile?.avatar ? (
                            <img src={user.profile.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                            user.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-bold text-ink-900">{name}</h1>
                            {user.is_owner && <span className="rounded-full bg-gaming-orange/20 px-2 py-0.5 text-[10px] font-bold text-gaming-orange">👑 OWNER</span>}
                            {user.is_admin && !user.is_owner && <span className="rounded-full bg-neon-red/20 px-2 py-0.5 text-[10px] font-bold text-neon-red">ADMIN</span>}
                            {!user.is_admin && user.is_moderator && <span className="rounded-full bg-gaming-cyan/20 px-2 py-0.5 text-[10px] font-bold text-gaming-cyan">MOD</span>}
                            {user.is_banned && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">BANNED</span>}
                            {user.profile?.is_creator && <span className="rounded-full bg-gaming-pink/20 px-2 py-0.5 text-[10px] font-bold text-gaming-pink">CREATOR</span>}
                            {user.profile?.is_featured_now && <span className="rounded-full bg-gaming-orange/20 px-2 py-0.5 text-[10px] font-bold text-gaming-orange">✨ FEATURED</span>}
                            {user.is_og_founder && <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-600" title="OG Founder — lifetime Plus">♛ OG FOUNDER</span>}
                        </div>
                        <p className="mt-1 text-sm text-ink-500">
                            {user.name} · {user.email} · joined {new Date(user.created_at).toLocaleDateString()} · last active {user.last_active}
                        </p>
                        {user.profile?.bio && <p className="mt-2 text-sm text-ink-700">{user.profile.bio}</p>}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-ink-500">
                            {user.profile?.region && <span>📍 {user.profile.region}</span>}
                            {user.profile?.looking_for && <span>🎯 {user.profile.looking_for}</span>}
                            {user.referral_code && <span>🔗 ref <code className="rounded bg-ink-900/5 px-1">{user.referral_code}</code></span>}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {!user.is_owner && (
                    <div className="mt-5 flex flex-wrap gap-2 border-t border-ink-900/5 pt-4">
                        {!user.is_admin && (
                            <button
                                onClick={toggleMod}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${user.is_moderator ? 'bg-gaming-cyan/10 text-gaming-cyan hover:bg-gaming-cyan/20' : 'bg-ink-900/5 text-ink-700 hover:bg-ink-900/10'}`}
                            >
                                {user.is_moderator ? 'Revoke mod' : 'Make mod'}
                            </button>
                        )}
                        <button
                            onClick={toggleAdmin}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${user.is_admin ? 'bg-neon-red/10 text-neon-red hover:bg-neon-red/20' : 'bg-ink-900/5 text-ink-700 hover:bg-ink-900/10'}`}
                        >
                            {user.is_admin ? 'Revoke admin' : 'Make admin'}
                        </button>
                        <button
                            onClick={toggleOgFounder}
                            title={user.is_og_founder ? 'Revoke OG Founder + lifetime Plus' : 'Grant OG Founder badge + lifetime Plus access'}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${user.is_og_founder ? 'bg-yellow-400/10 text-amber-600 hover:bg-yellow-400/20' : 'bg-ink-900/5 text-ink-700 hover:bg-ink-900/10'}`}
                        >
                            {user.is_og_founder ? '♛ Revoke OG' : '♛ Make OG Founder'}
                        </button>
                        <button
                            onClick={impersonate}
                            disabled={user.is_admin || user.is_banned}
                            title={user.is_admin ? "Admins can't be impersonated" : user.is_banned ? 'Unban first' : 'Debug as this user'}
                            className="rounded-lg bg-gaming-cyan/10 px-3 py-1.5 text-xs font-medium text-gaming-cyan transition hover:bg-gaming-cyan/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Log in as
                        </button>
                        {user.is_banned ? (
                            <button
                                onClick={handleUnban}
                                className="rounded-lg bg-gaming-green/10 px-3 py-1.5 text-xs font-medium text-gaming-green transition hover:bg-gaming-green/20"
                            >
                                Unban
                            </button>
                        ) : (
                            <button
                                onClick={handleBan}
                                className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
                            >
                                Ban
                            </button>
                        )}
                        <button
                            onClick={killSwitch}
                            disabled={user.is_admin || user.is_owner}
                            title={user.is_admin || user.is_owner ? 'Strip role first' : 'Emergency kill — ban + logout + close LFGs'}
                            className="rounded-lg bg-neon-red/10 px-3 py-1.5 text-xs font-medium text-neon-red transition hover:bg-neon-red/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Kill
                        </button>
                        {user.profile?.is_creator && (
                            <button
                                onClick={setFeatured}
                                title="Add to or remove from Creator Spotlight on homepage + dashboard"
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${user.profile.is_featured_now ? 'bg-gaming-orange/10 text-gaming-orange hover:bg-gaming-orange/20' : 'bg-gaming-pink/10 text-gaming-pink hover:bg-gaming-pink/20'}`}
                            >
                                {user.profile.is_featured_now
                                    ? `Edit spotlight (until ${user.profile.featured_until ? new Date(user.profile.featured_until).toLocaleDateString() : '?'})`
                                    : 'Add to spotlight'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Stats */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Friends" value={stats.friends} />
                <StatCard label="LFGs hosted" value={stats.lfg_hosted} />
                <StatCard label="Invitees" value={stats.invitees} />
                <StatCard label="Ratings" value={stats.rating_count} />
                <StatCard label="Reports against" value={stats.reports_against} tone={stats.reports_against > 0 ? 'warn' : undefined} />
                <StatCard label="Reputation" value={repDisplay} suffix={repDisplay !== '—' ? '★' : ''} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Games */}
                <Panel title="Games" empty={user.games.length === 0 ? 'No games added.' : undefined}>
                    <div className="divide-y divide-ink-900/5">
                        {user.games.map((g) => (
                            <div key={g.id} className="flex items-center justify-between px-4 py-3 text-sm">
                                <span className="font-medium text-ink-900">{g.name}</span>
                                <span className="text-xs text-ink-500">
                                    {g.rank && <span className="mr-2">{g.rank}</span>}
                                    {g.platform && <span className="capitalize text-gray-500">{g.platform}</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* Referral */}
                <Panel title="Referrals">
                    <div className="px-4 py-3 text-sm">
                        {user.referred_by ? (
                            <p className="mb-3 text-ink-700">
                                Invited by{' '}
                                <Link href={route('admin.users.show', { user: user.referred_by.id })} className="font-medium text-neon-red hover:underline">
                                    {user.referred_by.name}
                                </Link>
                            </p>
                        ) : (
                            <p className="mb-3 text-xs text-ink-500">No inviter on record.</p>
                        )}
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            Invited {stats.invitees} {stats.invitees === 1 ? 'person' : 'people'}
                        </p>
                        {invitees.length > 0 && (
                            <ul className="mt-2 space-y-1">
                                {invitees.map((i) => (
                                    <li key={i.id} className="flex items-center justify-between text-xs">
                                        <Link href={route('admin.users.show', { user: i.id })} className="text-ink-700 hover:text-neon-red hover:underline">
                                            {i.profile?.username || i.name}
                                        </Link>
                                        <span className="text-gray-500">{new Date(i.created_at).toLocaleDateString()}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Panel>

                {/* Recent LFGs */}
                <Panel title="Recent LFGs hosted" empty={recentLfg.length === 0 ? 'Has never hosted an LFG.' : undefined}>
                    <div className="divide-y divide-ink-900/5">
                        {recentLfg.map((l) => (
                            <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-ink-900">{l.title}</p>
                                    <p className="text-[11px] text-gray-500">{l.game?.name} · {new Date(l.created_at).toLocaleDateString()}</p>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${LFG_STATUS_TONE[l.status] || 'bg-ink-900/10 text-ink-500'}`}>
                                    {l.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* Admin audit trail */}
                <Panel title="Admin action history" empty={auditTrail.length === 0 ? 'No admin actions recorded for this user.' : undefined}>
                    <div className="divide-y divide-ink-900/5">
                        {auditTrail.map((a) => (
                            <div key={a.id} className="px-4 py-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-ink-900/5 px-2 py-0.5 font-semibold text-ink-700">{a.action}</span>
                                    <span className="text-gray-500" title={a.created_at || ''}>{a.created_at_human}</span>
                                </div>
                                <p className="mt-1 text-ink-500">
                                    by{' '}
                                    {a.actor ? (
                                        <span className="text-ink-700">
                                            {a.actor.name}
                                            {a.actor.is_owner && <span className="ml-1 text-gaming-orange">(owner)</span>}
                                        </span>
                                    ) : (
                                        <span className="text-gray-500">—</span>
                                    )}
                                </p>
                                {a.metadata && Object.keys(a.metadata).length > 0 && (
                                    <dl className="mt-1 flex flex-col gap-0.5">
                                        {Object.entries(a.metadata).map(([key, value]) => (
                                            <div key={key} className="flex gap-2">
                                                <dt className="shrink-0 text-[10px] uppercase tracking-wide text-gray-500">{key.replace(/_/g, ' ')}</dt>
                                                <dd className="min-w-0 break-words font-medium text-ink-700">
                                                    {value === null || value === undefined || value === ''
                                                        ? '—'
                                                        : typeof value === 'object'
                                                          ? JSON.stringify(value)
                                                          : String(value)}
                                                </dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* Reports against */}
                <Panel title={`Reports against (${reportsAgainst.length})`} empty={reportsAgainst.length === 0 ? 'No reports filed against this user.' : undefined}>
                    <div className="divide-y divide-ink-900/5">
                        {reportsAgainst.map((r) => (
                            <div key={r.id} className="px-4 py-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-ink-900">{r.reason}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${REPORT_STATUS_TONE[r.status] || 'bg-ink-900/10 text-ink-500'}`}>
                                        {r.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-ink-500">
                                    by {r.reporter ? (
                                        <Link href={route('admin.users.show', { user: r.reporter.id })} className="text-ink-700 hover:underline">
                                            {displayName(r.reporter)}
                                        </Link>
                                    ) : '—'} · {new Date(r.created_at).toLocaleDateString()}
                                </p>
                                {r.details && <p className="mt-1 text-ink-500">{r.details}</p>}
                            </div>
                        ))}
                    </div>
                </Panel>

                {/* Reports filed */}
                <Panel title={`Reports filed by this user (${reportsFiled.length})`} empty={reportsFiled.length === 0 ? 'This user has never filed a report.' : undefined}>
                    <div className="divide-y divide-ink-900/5">
                        {reportsFiled.map((r) => (
                            <div key={r.id} className="px-4 py-3 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-ink-900">{r.reason}</span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${REPORT_STATUS_TONE[r.status] || 'bg-ink-900/10 text-ink-500'}`}>
                                        {r.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-ink-500">
                                    against {r.reported ? (
                                        <Link href={route('admin.users.show', { user: r.reported.id })} className="text-ink-700 hover:underline">
                                            {displayName(r.reported)}
                                        </Link>
                                    ) : '—'} · {new Date(r.created_at).toLocaleDateString()}
                                </p>
                                {r.details && <p className="mt-1 text-ink-500">{r.details}</p>}
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </AdminLayout>
    );
}

function StatCard({ label, value, suffix, tone }: { label: string; value: number | string; suffix?: string; tone?: 'warn' }) {
    return (
        <div className={`rounded-xl border p-4 ${tone === 'warn' ? 'border-gaming-orange/30 bg-gaming-orange/5' : 'border-ink-900/10 bg-white dark:bg-bone-100'}`}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className={`mt-1 text-xl font-bold ${tone === 'warn' ? 'text-gaming-orange' : 'text-ink-900'}`}>
                {value}{suffix && <span className="ml-0.5 text-sm text-yellow-400">{suffix}</span>}
            </p>
        </div>
    );
}

function Panel({ title, empty, children }: { title: string; empty?: string; children?: React.ReactNode }) {
    return (
        <div className="overflow-hidden rounded-xl border border-ink-900/10 bg-white dark:bg-bone-100">
            <div className="border-b border-ink-900/5 px-4 py-3">
                <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
            </div>
            {empty ? (
                <p className="px-4 py-6 text-center text-xs text-ink-500">{empty}</p>
            ) : children}
        </div>
    );
}
