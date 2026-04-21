import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

interface TeamMember {
    id: number;
    name: string;
    username?: string;
    avatar?: string;
    bio?: string;
    is_admin: boolean;
    is_moderator: boolean;
    region?: string;
}

export default function CommunityTeam({ team }: { team: TeamMember[] }) {
    const admins = team.filter((m) => m.is_admin);
    const mods = team.filter((m) => !m.is_admin && m.is_moderator);

    return (
        <AuthenticatedLayout>
            <Head title="Community Team" />

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-ink-900">Community Team</h1>
                    <p className="mt-2 text-sm text-ink-500">
                        Our admins and moderators volunteer to keep the community respectful and spam-free. They can hide, lock, and pin posts, review reports, and keep things on track.
                    </p>
                </div>

                {admins.length > 0 && (
                    <section className="mb-10">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-neon-red">Admins</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {admins.map((m) => <TeamCard key={m.id} member={m} />)}
                        </div>
                    </section>
                )}

                {mods.length > 0 && (
                    <section className="mb-10">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-gaming-cyan">Moderators</h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {mods.map((m) => <TeamCard key={m.id} member={m} />)}
                        </div>
                    </section>
                )}

                {team.length === 0 && (
                    <div className="rounded-xl border border-ink-900/10 bg-white p-10 text-center text-sm text-ink-500">
                        No team members listed yet.
                    </div>
                )}

                <div className="mt-8 rounded-xl border border-ink-900/10 bg-bone-100 p-5">
                    <h3 className="text-base font-bold text-ink-900">Seen something off?</h3>
                    <p className="mt-1 text-sm text-ink-500">
                        Use the <strong>Report</strong> button on the post, comment, or player profile. Our team reviews reports in the mod queue — distributing the load means faster response.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Link href={route('community.guidelines')} className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red">
                            Read community guidelines
                        </Link>
                        <Link href={route('reports.mine')} className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red">
                            My reports
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function TeamCard({ member }: { member: TeamMember }) {
    const badge = member.is_admin
        ? { label: 'ADMIN', className: 'bg-neon-red/20 text-neon-red' }
        : { label: 'MOD', className: 'bg-gaming-cyan/20 text-gaming-cyan' };

    return (
        <Link
            href={member.username ? `/player/${member.username}` : '#'}
            className="group rounded-xl border border-ink-900/10 bg-white p-4 transition hover:border-neon-red/30"
        >
            <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neon-red/20 text-lg font-bold text-neon-red">
                    {member.avatar ? (
                        <img src={member.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                        (member.username || member.name).charAt(0).toUpperCase()
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate font-semibold text-ink-900 group-hover:text-neon-red">
                            {member.username || member.name}
                        </p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${badge.className}`}>
                            {badge.label}
                        </span>
                    </div>
                    {member.region && <p className="text-[11px] text-ink-500">{member.region}</p>}
                    {member.bio && <p className="mt-1 text-xs text-ink-500 line-clamp-2">{member.bio}</p>}
                </div>
            </div>
        </Link>
    );
}
