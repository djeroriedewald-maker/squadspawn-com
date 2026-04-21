import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const RULES = [
    {
        title: 'Respect your teammates',
        body: 'No slurs, harassment, or personal attacks. You can disagree with someone\'s takes without attacking them as a person. Repeated toxic behaviour → account suspension.',
    },
    {
        title: 'No spam or self-promotion',
        body: 'Don\'t post the same content in multiple threads. Linking your own stream or YouTube once in a relevant discussion is fine; flooding the feed with it is not. Paid promotion requires admin approval.',
    },
    {
        title: 'Keep NSFW out',
        body: 'No nudity, gore, or shock content. Gaming-adjacent mature content (ESRB M, PEGI 18 game screenshots) is allowed if clearly marked and on-topic.',
    },
    {
        title: 'No cheating or exploit promotion',
        body: 'Don\'t recruit for cheat-sharing squads, share exploit guides, or advertise boosting services. Reports about cheaters you played with → use the teammate-rating flow instead.',
    },
    {
        title: 'Honest posting',
        body: 'Don\'t fake your rank, platform, or region to join groups you don\'t belong in. The reputation system works because the data is real.',
    },
    {
        title: 'One account per person',
        body: 'Smurf accounts, ban-evasion accounts, and alts used to manipulate votes or reports will be removed. Shared family devices are fine — just keep one account per person.',
    },
];

export default function CommunityGuidelines() {
    return (
        <AuthenticatedLayout>
            <Head title="Community Guidelines" />

            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-ink-900">Community Guidelines</h1>
                    <p className="mt-2 text-sm text-ink-500">
                        These rules apply to everything on SquadSpawn — LFG posts, community threads, comments, chat, ratings. Mods and admins enforce them.
                    </p>
                </div>

                <div className="space-y-4">
                    {RULES.map((r, i) => (
                        <div key={i} className="rounded-xl border border-ink-900/10 bg-white p-5">
                            <h2 className="flex items-center gap-2 text-lg font-bold text-ink-900">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-red/20 text-xs font-black text-neon-red">{i + 1}</span>
                                {r.title}
                            </h2>
                            <p className="mt-2 text-sm leading-relaxed text-ink-700">{r.body}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-8 rounded-xl border border-ink-900/10 bg-bone-100 p-5">
                    <h3 className="text-base font-bold text-ink-900">What happens if you break a rule?</h3>
                    <ul className="mt-3 space-y-2 text-sm text-ink-700">
                        <li>• <strong>Minor first-time issues</strong> → the content is hidden by a mod with a short reason.</li>
                        <li>• <strong>Repeat offences or worse</strong> → thread locked and content stays hidden; the user may be warned.</li>
                        <li>• <strong>Serious violations (harassment, cheats, NSFW, evasion)</strong> → admin review, account ban.</li>
                    </ul>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                    <Link href={route('community.team')} className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red">
                        Meet the team
                    </Link>
                    <Link href={route('reports.mine')} className="rounded-lg border border-ink-900/10 bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red">
                        My reports
                    </Link>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
