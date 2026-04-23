import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Disclosure, Transition } from '@headlessui/react';
import { Head, Link, usePage } from '@inertiajs/react';
import { ReactNode, useEffect, useMemo, useState } from 'react';

// ──────────────────────────────────────────────────────────────────
// Content
// FAQs are authored here (hard-coded) so the page stays a single-file
// route with no CMS round-trip. If we ever localise the platform, this
// is the block that moves into a lang file.
// ──────────────────────────────────────────────────────────────────

type CategoryId = 'start' | 'lfg' | 'reputation' | 'friends' | 'account' | 'safety';

interface Category {
    id: CategoryId;
    title: string;
    blurb: string;
    /** Static class trio for the icon badge — keep these literal so the
     *  Tailwind JIT picks them up (dynamic `bg-${color}/10` doesn't work). */
    iconClass: string;
    icon: ReactNode;
}

interface Faq {
    id: string;
    category: CategoryId;
    question: string;
    // rich answer — allow short paragraphs + optional inline link
    answer: ReactNode;
}

const ICON = (d: string) => (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
);

const CATEGORIES: Category[] = [
    {
        id: 'start',
        title: 'Getting started',
        blurb: 'Create your profile, add games, and find your first squad.',
        iconClass: 'bg-neon-red/10 text-neon-red ring-neon-red/20',
        icon: ICON('M12 4.5v15m7.5-7.5h-15'),
    },
    {
        id: 'lfg',
        title: 'LFG & groups',
        blurb: 'Host or join Looking-For-Group posts, chat, and schedule sessions.',
        iconClass: 'bg-gaming-cyan/10 text-gaming-cyan ring-gaming-cyan/20',
        icon: ICON('M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.118a7.5 7.5 0 0 1 15 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.636 1.85 13.067 13.067 0 0 1-6.637-1.85.75.75 0 0 1-.363-.63l-.001-.122Z'),
    },
    {
        id: 'reputation',
        title: 'Reputation & ratings',
        blurb: 'How stars, tags, and trust signals work on SquadSpawn.',
        iconClass: 'bg-gaming-orange/10 text-gaming-orange ring-gaming-orange/20',
        icon: ICON('M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z'),
    },
    {
        id: 'friends',
        title: 'Friends & discovery',
        blurb: 'Swipe, match, chat, and favourite trusted hosts.',
        iconClass: 'bg-gaming-pink/10 text-gaming-pink ring-gaming-pink/20',
        icon: ICON('M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z'),
    },
    {
        id: 'account',
        title: 'Account & integrations',
        blurb: 'Steam, Google, avatars, notifications, XP and achievements.',
        iconClass: 'bg-gaming-green/10 text-gaming-green ring-gaming-green/20',
        icon: ICON('M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z'),
    },
    {
        id: 'safety',
        title: 'Safety & privacy',
        blurb: 'Blocking, reporting, your data, and account deletion.',
        iconClass: 'bg-ink-700/10 text-ink-700 ring-ink-700/20',
        icon: ICON('M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z'),
    },
];

const FAQS: Faq[] = [
    // ── Getting started ──────────────────────────────────────────
    {
        id: 'signup',
        category: 'start',
        question: 'How do I sign up?',
        answer: (
            <>
                You can register with email + password, or one-tap with <strong>Google</strong>. Both routes take you straight into profile setup. Under 18? We ask for your date of birth and — in the 13-15 range within the EEA — parental consent, in line with GDPR Art. 8.
            </>
        ),
    },
    {
        id: 'complete-profile',
        category: 'start',
        question: 'What counts as a "complete profile"?',
        answer: (
            <>
                A username, avatar (upload or pick a preset), region, and at least one game added. Discovery and LFG are gated behind this — it's the baseline other players see before deciding to team up with you.
            </>
        ),
    },
    {
        id: 'first-game',
        category: 'start',
        question: 'How do I add my first game?',
        answer: (
            <>
                Head to <Link href={route('games.index')} className="text-neon-red hover:underline">Games</Link>, open any title, and hit <em>Add to profile</em>. For more nuance (rank, role, platform), open <Link href={route('game-profile.edit')} className="text-neon-red hover:underline">Profile setup</Link>.
            </>
        ),
    },

    // ── LFG ──────────────────────────────────────────────────────
    {
        id: 'lfg-post',
        category: 'lfg',
        question: 'How do I post an LFG?',
        answer: (
            <>
                Click <strong>LFG → New</strong>. Pick a game, the number of spots, platform, and optional rank/language/mic preferences. Your post is visible to everyone who plays that game; you can limit it further with filters.
            </>
        ),
    },
    {
        id: 'lfg-auto-accept',
        category: 'lfg',
        question: 'What does "auto-accept" do?',
        answer: (
            <>
                With auto-accept on, anyone who fits your post's requirements joins immediately — no review. Off by default, so you decide per request. Great for casual sessions, off if you want to vet teammates.
            </>
        ),
    },
    {
        id: 'lfg-requests',
        category: 'lfg',
        question: 'How do I handle join requests?',
        answer: (
            <>
                They show up in the floating chat widget and on the LFG detail page. Accept or reject with one click. You'll see the applicant's reputation score and shared games before you decide.
            </>
        ),
    },
    {
        id: 'lfg-schedule',
        category: 'lfg',
        question: 'Can I schedule an LFG for later?',
        answer: (
            <>
                Yes — set a <em>Scheduled at</em> date/time when you post. Scheduled posts get their own tab in the feed so people don't miss them, and you can ping everyone in the group chat when it's go-time.
            </>
        ),
    },
    {
        id: 'lfg-close',
        category: 'lfg',
        question: 'When does an LFG close?',
        answer: (
            <>
                Automatically when it's been open for 6 hours, or when you click <em>End session</em>. Closing the session triggers the ratings flow — that's how reputation data gets built.
            </>
        ),
    },

    // ── Reputation ───────────────────────────────────────────────
    {
        id: 'reputation-score',
        category: 'reputation',
        question: 'What is my reputation score?',
        answer: (
            <>
                A 1-5 star average based on ratings from people you've actually played with — both friend-ratings and post-session LFG ratings. Profiles with fewer than 3 ratings show "New player" instead of a star, so you're not judged on a single data point.
            </>
        ),
    },
    {
        id: 'rating-rules',
        category: 'reputation',
        question: 'Who can rate whom?',
        answer: (
            <>
                Only people you've teamed up with: matched friends, or accepted members of an LFG you closed. We intentionally don't allow drive-by ratings from random visitors — reputation only means something if it reflects real sessions.
            </>
        ),
    },
    {
        id: 'rating-tags',
        category: 'reputation',
        question: 'What do the tags mean?',
        answer: (
            <>
                Tags are optional labels you can add to a rating: <em>great teammate</em>, <em>good comms</em>, <em>skilled</em>, <em>friendly</em>, or — if needed — <em>toxic</em>, <em>no-show</em>. Positive tags boost your profile's top-tags display; negative tags are private to moderators.
            </>
        ),
    },
    {
        id: 'rating-after-session',
        category: 'reputation',
        question: 'What happens after a session closes?',
        answer: (
            <>
                Accepted members get a rating prompt on the dashboard and a push notification. You can rate teammates up to 7 days after the session closes — after that, ratings are locked to keep them honest.
            </>
        ),
    },

    // ── Friends & discovery ──────────────────────────────────────
    {
        id: 'match',
        category: 'friends',
        question: 'How does matching work?',
        answer: (
            <>
                On <Link href={route('discovery.index')} className="text-neon-red hover:underline">Discover</Link>, swipe through players who share at least one of your games. Like someone; if they like you back, you're matched — a chat opens and you show up in each other's Friends list.
            </>
        ),
    },
    {
        id: 'pass',
        category: 'friends',
        question: "What does 'Pass' do?",
        answer: (
            <>
                A pass hides that player from your discovery queue. They never learn they were passed — no hard feelings. You can undo your last pass with the <em>Undo</em> button, or review/remove passes in <Link href={route('discovery.passed')} className="text-neon-red hover:underline">Discover → Passed</Link>.
            </>
        ),
    },
    {
        id: 'favourite-hosts',
        category: 'friends',
        question: 'What are favourite hosts?',
        answer: (
            <>
                Tap the ⭐ on someone's profile or LFG post and you'll get a push whenever they host a new session. Good for the players you trust most — it's the easiest way to keep teaming up with the same squad without forcing a friendship.
            </>
        ),
    },
    {
        id: 'chat',
        category: 'friends',
        question: 'How does chat work?',
        answer: (
            <>
                Matched friends get 1-on-1 chat; LFG members get a group chat per session. Both are accessible from the floating chat widget (bottom-right) anywhere on the platform. Messages are polled in near-real-time; push notifications fire if you have them enabled.
            </>
        ),
    },

    // ── Account & integrations ───────────────────────────────────
    {
        id: 'steam',
        category: 'account',
        question: 'How do I link my Steam account?',
        answer: (
            <>
                Open <Link href={route('steam.link.show')} className="text-neon-red hover:underline">Profile → Steam link</Link> and paste your Steam profile URL, vanity name, or SteamID64. We pull your persona + public playtime; nothing is written back to Steam. One Steam ID can only be linked to one SquadSpawn profile.
            </>
        ),
    },
    {
        id: 'google',
        category: 'account',
        question: 'Google login and an existing password account?',
        answer: (
            <>
                For security, we never merge accounts automatically. If your email already exists, sign in with your password first — we'll add a "Link Google" option in settings soon. Brand-new emails create an account straight from Google.
            </>
        ),
    },
    {
        id: 'avatar',
        category: 'account',
        question: 'Can I change my avatar?',
        answer: (
            <>
                Yes — upload your own (JPG/PNG/WEBP, max 2 MB, 100-2000 px each side) or pick one of the preset gaming avatars. Open the avatar picker from your profile or <Link href={route('game-profile.edit')} className="text-neon-red hover:underline">Profile setup</Link>.
            </>
        ),
    },
    {
        id: 'push',
        category: 'account',
        question: 'How do I turn push notifications on or off?',
        answer: (
            <>
                Open <Link href={route('profile.edit')} className="text-neon-red hover:underline">your profile settings</Link> and scroll to <em>Push notifications</em> to toggle per type (new message, LFG request, match, etc.). You can also revoke the whole browser permission from your browser's site settings.
            </>
        ),
    },
    {
        id: 'xp',
        category: 'account',
        question: 'How do XP and achievements work?',
        answer: (
            <>
                You earn XP for completing your profile, hosting LFGs, rating teammates, inviting friends, and more. Levels unlock cosmetic badges on your profile. See the full list in <Link href={route('achievements.index')} className="text-neon-red hover:underline">Achievements</Link>.
            </>
        ),
    },

    // ── Safety & privacy ─────────────────────────────────────────
    {
        id: 'block',
        category: 'safety',
        question: 'How do I block someone?',
        answer: (
            <>
                Open their profile and hit <em>Block</em>. They disappear from your feeds and can't message you or see your posts; you disappear from theirs. Blocking is silent — they don't get a notification.
            </>
        ),
    },
    {
        id: 'report',
        category: 'safety',
        question: 'How do I report inappropriate behaviour?',
        answer: (
            <>
                Use the <em>Report</em> button on the profile, LFG post, community post, or comment. Pick a reason, add detail if you want, and our moderators review it in the mod queue. Serious cases are acted on within hours, most within a day.
            </>
        ),
    },
    {
        id: 'data',
        category: 'safety',
        question: 'What data do you store about me?',
        answer: (
            <>
                Profile data, game list, ratings you've given and received, LFG posts and chats, plus basic analytics when you opt in to cookies. Nothing is sold. See our <Link href="/privacy-policy" className="text-neon-red hover:underline">Privacy Policy</Link> for the full list and retention periods.
            </>
        ),
    },
    {
        id: 'export',
        category: 'safety',
        question: 'Can I download my data?',
        answer: (
            <>
                Yes — GDPR Article 20 is built in. Go to <Link href={route('profile.dataExport')} className="text-neon-red hover:underline">Settings → Data export</Link> and you'll get a JSON bundle with your profile, games, messages, ratings, and more. Rate-limited to 3 per 10 minutes to keep the feature from being abused.
            </>
        ),
    },
    {
        id: 'delete',
        category: 'safety',
        question: 'How do I delete my account?',
        answer: (
            <>
                Open <Link href={route('profile.edit')} className="text-neon-red hover:underline">Settings</Link> and scroll to <em>Delete account</em>. Deletion wipes your profile, avatars, messages, ratings, and game list. We keep moderation logs (mod actions, reports) so we can maintain a fair record; those are anonymised after 90 days.
            </>
        ),
    },
];

// ──────────────────────────────────────────────────────────────────

export default function HelpIndex() {
    const { auth } = usePage().props as any;
    const isAuthed = !!auth?.user;

    const [query, setQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');

    // Deep-link support — open a category or a specific question via hash.
    useEffect(() => {
        const hash = window.location.hash.replace('#', '');
        if (!hash) return;
        const asCategory = CATEGORIES.find((c) => c.id === hash);
        if (asCategory) {
            setActiveCategory(asCategory.id);
            return;
        }
        const asFaq = FAQS.find((f) => f.id === hash);
        if (asFaq) {
            setActiveCategory(asFaq.category);
            // Give the disclosure a tick to render before scrolling.
            setTimeout(() => {
                document.getElementById('faq-' + asFaq.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 120);
        }
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return FAQS.filter((f) => {
            if (activeCategory !== 'all' && f.category !== activeCategory) return false;
            if (!q) return true;
            const textPool = (f.question + ' ' + extractText(f.answer)).toLowerCase();
            return textPool.includes(q);
        });
    }, [query, activeCategory]);

    const body = (
        <>
            <Head title="Help & Support" />

            {/* ── Hero ────────────────────────────────────────── */}
            <section className="relative overflow-hidden bg-gradient-to-b from-bone-50 to-bone-100 pb-14 pt-14 sm:pt-20">
                {/* Background orbs for the red-neon vibe, pointer-none so they
                    never block clicks. */}
                <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-neon-red/20 blur-3xl" />
                <div aria-hidden className="pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-gaming-cyan/15 blur-3xl" />

                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-red/30 bg-neon-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-neon-red">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neon-red" />
                        Help centre
                    </span>
                    <h1 className="text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
                        How can we <span className="text-neon-red">help</span>?
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm text-ink-500 sm:text-base">
                        Quick answers to everything about SquadSpawn — from posting your first LFG to linking Steam and keeping your data safe.
                    </p>

                    <div className="mx-auto mt-8 max-w-xl">
                        <label className="relative block">
                            <span className="sr-only">Search help</span>
                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-500">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.2-5.2m2.2-5.3a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
                                </svg>
                            </span>
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for Steam, reputation, LFG…"
                                className="w-full rounded-2xl border border-ink-900/10 bg-white py-4 pl-12 pr-4 text-sm text-ink-900 shadow-lg shadow-neon-red/10 outline-none transition focus:border-neon-red/40 focus:ring-4 focus:ring-neon-red/10"
                            />
                        </label>

                        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
                            <span className="text-ink-500">Popular:</span>
                            {['signup', 'steam', 'reputation-score', 'lfg-post', 'delete'].map((id) => {
                                const f = FAQS.find((x) => x.id === id);
                                if (!f) return null;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => {
                                            setActiveCategory(f.category);
                                            setQuery('');
                                            setTimeout(() => document.getElementById('faq-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
                                        }}
                                        className="rounded-full border border-ink-900/10 bg-white px-3 py-1 font-medium text-ink-700 transition hover:border-neon-red/40 hover:text-neon-red"
                                    >
                                        {shorten(f.question)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Category grid ───────────────────────────────── */}
            <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-ink-500">Browse by topic</h2>
                    {activeCategory !== 'all' && (
                        <button
                            onClick={() => setActiveCategory('all')}
                            className="text-xs font-semibold text-neon-red hover:underline"
                        >
                            Show all categories
                        </button>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {CATEGORIES.map((c) => {
                        const active = activeCategory === c.id;
                        const count = FAQS.filter((f) => f.category === c.id).length;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                    setActiveCategory(active ? 'all' : c.id);
                                    setTimeout(() => document.getElementById('faq-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
                                }}
                                className={`group relative flex items-start gap-4 overflow-hidden rounded-2xl border p-5 text-left transition ${
                                    active
                                        ? 'border-neon-red/50 bg-gradient-to-br from-white to-neon-red/5 shadow-glow-red'
                                        : 'border-ink-900/10 bg-white hover:-translate-y-0.5 hover:border-neon-red/30 hover:shadow-lg'
                                }`}
                            >
                                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${c.iconClass}`}>
                                    {c.icon}
                                </span>
                                <span className="flex-1">
                                    <span className="flex items-center gap-2">
                                        <span className="text-base font-bold text-ink-900">{c.title}</span>
                                        <span className="rounded-full bg-bone-100 px-2 py-0.5 text-[10px] font-semibold text-ink-500">{count}</span>
                                    </span>
                                    <span className="mt-1 block text-xs text-ink-500">{c.blurb}</span>
                                </span>
                                <svg className="h-4 w-4 shrink-0 text-ink-500 transition group-hover:translate-x-0.5 group-hover:text-neon-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5-5 5M6 12h12" />
                                </svg>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* ── FAQ list ────────────────────────────────────── */}
            <section id="faq-list" className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-ink-500">
                        {activeCategory === 'all' ? 'All questions' : CATEGORIES.find((c) => c.id === activeCategory)?.title}
                    </h2>
                    <span className="text-xs text-ink-500">{filtered.length} {filtered.length === 1 ? 'result' : 'results'}</span>
                </div>

                {filtered.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-ink-900/15 bg-white p-10 text-center">
                        <p className="text-sm text-ink-500">
                            No answers match <strong className="text-ink-900">"{query}"</strong>.
                        </p>
                        <p className="mt-2 text-xs text-ink-500">
                            Try a different word, or <a href="mailto:info@squadspawn.com" className="text-neon-red hover:underline">email us</a>.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((f) => (
                            <FaqRow key={f.id} faq={f} query={query} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── Contact block ──────────────────────────────── */}
            <section className="mx-auto max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
                {/* Hardcoded dark background: `ink-900` is a themed token
                    that inverts to near-white in dark mode, which made the
                    gradient render as a washed-out card. Using raw hex
                    keeps the "black → red" look in both themes. */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#14121a] via-[#14121a] to-neon-red-deep p-8 text-white sm:p-10">
                    <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-neon-red/30 blur-3xl" />
                    <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                            <h3 className="text-2xl font-bold sm:text-3xl text-white">Still stuck?</h3>
                            <p className="mt-2 max-w-lg text-sm text-white/70">
                                Can't find what you're looking for? Reach out directly — we're a small team and we read every message.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href="mailto:info@squadspawn.com"
                                className="inline-flex items-center gap-2 rounded-xl bg-neon-red px-5 py-3 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                                Email support
                            </a>
                            {isAuthed && (
                                <Link
                                    href={route('community.guidelines')}
                                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                                >
                                    Community guidelines
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                <p className="mt-6 text-center text-xs text-ink-500">
                    Response time: usually under 24h on weekdays. For bans or sensitive issues, please include your username.
                </p>
            </section>
        </>
    );

    // Authed users get the full app shell; guests get the lightweight Legal-
    // style layout so they can read help without signing up.
    if (isAuthed) {
        return <AuthenticatedLayout>{body}</AuthenticatedLayout>;
    }

    return (
        <div className="min-h-screen bg-bone-50 text-ink-900">
            <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                <div className="flex items-center gap-2 text-xs">
                    <Link href={route('login')} className="rounded-lg px-3 py-1.5 font-semibold text-ink-700 transition hover:text-neon-red">Sign in</Link>
                    <Link href={route('register')} className="rounded-lg bg-neon-red px-3 py-1.5 font-semibold text-white shadow-glow-red transition hover:bg-neon-red/90">Get started</Link>
                </div>
            </nav>
            {body}
            <footer className="border-t border-ink-900/10 bg-bone-50 px-6 py-8 lg:px-12">
                <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-ink-500 sm:flex-row">
                    <div className="flex flex-wrap items-center gap-4">
                        <a href="/privacy-policy" className="hover:text-ink-900">Privacy</a>
                        <a href="/terms-of-service" className="hover:text-ink-900">Terms</a>
                        <a href="/cookie-policy" className="hover:text-ink-900">Cookies</a>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <a
                            href="https://instagram.com/squadspawnhq"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-gaming-pink/10 px-2.5 py-1 font-medium text-gaming-pink transition hover:bg-gaming-pink/20"
                            aria-label="Follow SquadSpawn on Instagram"
                        >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                            @squadspawnhq
                        </a>
                        <a
                            href="https://www.reddit.com/user/Squadspawn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md bg-[#FF4500]/10 px-2.5 py-1 font-medium text-[#FF4500] transition hover:bg-[#FF4500]/20"
                            aria-label="Follow SquadSpawn on Reddit"
                        >
                            <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.983 0 1.78.797 1.78 1.78 0 .703-.41 1.307-1.002 1.594a3.54 3.54 0 0 1 .046.572c0 2.908-3.384 5.265-7.558 5.265-4.174 0-7.558-2.357-7.558-5.265 0-.194.016-.385.046-.572-.593-.287-1.002-.891-1.002-1.594 0-.983.797-1.78 1.78-1.78.477 0 .899.182 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.91-4.27a.39.39 0 0 1 .454-.303l2.971.627a1.25 1.25 0 0 1 1.217-.947zM9.332 14.008c-.757 0-1.369.559-1.369 1.253 0 .694.612 1.253 1.369 1.253s1.368-.559 1.368-1.253c0-.694-.611-1.253-1.368-1.253zm5.386 0c-.757 0-1.368.559-1.368 1.253 0 .694.611 1.253 1.368 1.253s1.369-.559 1.369-1.253c0-.694-.612-1.253-1.369-1.253zm-5.27 3.487a.27.27 0 0 0-.192.45c.775.775 2.256.836 2.69.836.433 0 1.915-.061 2.69-.836a.27.27 0 0 0-.038-.41.28.28 0 0 0-.375.02c-.488.49-1.53.664-2.277.664-.746 0-1.788-.174-2.277-.664a.28.28 0 0 0-.22-.06z" /></svg>
                            u/Squadspawn
                        </a>
                        <p>&copy; {new Date().getFullYear()} SquadSpawn</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ── One FAQ row — Headless UI disclosure with smooth expand ────
function FaqRow({ faq, query }: { faq: Faq; query: string }) {
    return (
        <div id={'faq-' + faq.id} className="scroll-mt-24">
            <Disclosure>
                {({ open }) => (
                    <div className={`overflow-hidden rounded-2xl border transition ${open ? 'border-neon-red/40 bg-white shadow-lg shadow-neon-red/5' : 'border-ink-900/10 bg-white hover:border-neon-red/20'}`}>
                        <Disclosure.Button className="flex w-full items-start gap-4 px-5 py-4 text-left">
                            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${open ? 'bg-neon-red text-white' : 'bg-bone-100 text-ink-700'}`}>
                                {open ? '−' : '+'}
                            </span>
                            <span className="flex-1 text-sm font-semibold text-ink-900 sm:text-base">
                                {highlight(faq.question, query)}
                            </span>
                        </Disclosure.Button>
                        <Transition
                            enter="transition duration-150 ease-out"
                            enterFrom="opacity-0 -translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition duration-100 ease-in"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <Disclosure.Panel className="px-5 pb-5 pl-[68px]">
                                <div className="text-sm leading-relaxed text-ink-700">{faq.answer}</div>
                                <div className="mt-3 flex items-center justify-between text-[11px] text-ink-500">
                                    <a
                                        href={'#' + faq.id}
                                        onClick={(e) => {
                                            // Copy deep-link to clipboard for shareability.
                                            e.preventDefault();
                                            const url = new URL(window.location.href);
                                            url.hash = faq.id;
                                            history.replaceState(null, '', url.toString());
                                            navigator.clipboard?.writeText(url.toString()).catch(() => {});
                                        }}
                                        className="inline-flex items-center gap-1 hover:text-neon-red"
                                        title="Copy link to this answer"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                        </svg>
                                        Copy link
                                    </a>
                                </div>
                            </Disclosure.Panel>
                        </Transition>
                    </div>
                )}
            </Disclosure>
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────

/** Strip JSX to plain text so the search filter can run over the answer. */
function extractText(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(extractText).join(' ');
    if (node && typeof node === 'object' && 'props' in (node as any)) {
        return extractText((node as any).props.children);
    }
    return '';
}

/** Highlight the query substring inside the question text, preserving case. */
function highlight(text: string, query: string): ReactNode {
    const q = query.trim();
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="rounded bg-neon-red/20 px-0.5 text-ink-900">{text.slice(idx, idx + q.length)}</mark>
            {text.slice(idx + q.length)}
        </>
    );
}

function shorten(q: string): string {
    return q.length > 28 ? q.slice(0, 26).trim() + '…' : q;
}
