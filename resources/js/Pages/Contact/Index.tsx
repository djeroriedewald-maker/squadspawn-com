import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, ReactNode, useState } from 'react';

interface AuthUser {
    id: number;
    name: string;
    email?: string;
    profile?: { username?: string; avatar?: string };
}

interface Props {
    prefillName: string;
    prefillEmail: string;
}

const CATEGORIES: { value: string; label: string; description: string }[] = [
    { value: 'bug', label: 'Bug report', description: 'Something broken or throwing errors.' },
    { value: 'feature', label: 'Feature request', description: "An idea you'd like us to build." },
    { value: 'feedback', label: 'General feedback', description: 'How SquadSpawn is feeling to use.' },
    { value: 'creator', label: 'Creator Spotlight', description: 'Want your channel considered for the spotlight.' },
    { value: 'partnership', label: 'Partnership / brand', description: 'Sponsorship, collab, or team inquiry.' },
    { value: 'press', label: 'Press / media', description: 'Interviews, articles, features.' },
    { value: 'privacy', label: 'Privacy / GDPR', description: 'Data access, export, or erasure requests.' },
    { value: 'other', label: 'Something else', description: 'Anything not listed above.' },
];

export default function ContactIndex({ prefillName, prefillEmail }: Props) {
    const pageProps = usePage().props as {
        flash?: { message?: string };
        auth?: { user?: AuthUser };
    };
    const flash = pageProps.flash;
    const authedUser = pageProps.auth?.user;
    const [sent, setSent] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        email: string;
        subject: string;
        category: string;
        body: string;
        website: string;
    }>({
        name: prefillName,
        email: prefillEmail,
        subject: '',
        category: 'feedback',
        body: '',
        website: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('contact.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setSent(true);
                reset('subject', 'body');
                setData('category', 'feedback');
            },
        });
    };

    const selectedCat = CATEGORIES.find((c) => c.value === data.category);
    const isAuthed = !!authedUser;

    // When signed in, wrap in AuthenticatedLayout so the user keeps the
    // site nav + floating chat + notification bell. Logged-out visitors
    // get the minimal standalone chrome so they reach the form fast.
    const pageBody = (
        <>
            <section className="relative flex h-64 flex-col justify-end overflow-hidden sm:h-72">
                <div className="absolute inset-0">
                    <img
                        src="/images/gamer6.jpg"
                        alt=""
                        className="h-full w-full object-cover"
                        loading="eager"
                    />
                </div>

                {!isAuthed && (
                    <nav className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4 lg:px-12">
                        <Link href="/" className="rounded-md bg-white/90 px-3 py-1 text-lg font-bold text-neon-red backdrop-blur">
                            SquadSpawn
                        </Link>
                        <Link
                            href="/"
                            className="rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-ink-900 backdrop-blur transition hover:bg-white"
                        >
                            ← Back
                        </Link>
                    </nav>
                )}

                <div className="relative mx-auto w-full max-w-2xl px-6 pb-8 text-center lg:px-12">
                    <span
                        className="inline-flex items-center gap-2 rounded-full bg-gaming-cyan/90 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-black shadow"
                    >
                        📬 We read every message
                    </span>
                    <h1
                        className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl"
                        style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
                    >
                        Get in touch
                    </h1>
                    <p
                        className="mx-auto mt-2 max-w-lg text-sm text-white sm:text-base"
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
                    >
                        Feedback, bugs, partnerships, press &mdash; anything. Drop us a line and we&apos;ll get back to you.
                    </p>
                </div>
            </section>

            <div className="mx-auto max-w-2xl px-6 py-10 lg:px-12">
                    {authedUser && !sent && (
                        <div className="mb-4 flex items-center gap-3 rounded-xl border border-gaming-cyan/30 bg-gaming-cyan/10 px-4 py-3 text-sm">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gaming-cyan/30 text-xs font-bold text-gaming-cyan">
                                {authedUser.profile?.avatar ? (
                                    <img src={authedUser.profile.avatar} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    (authedUser.profile?.username ?? authedUser.name).charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-ink-900">
                                    Signed in as {authedUser.profile?.username ?? authedUser.name}
                                </p>
                                <p className="text-[11px] text-ink-500">
                                    This message will be linked to your account so we can help faster. Log out first if you want to send it anonymously.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-xl shadow-neon-red/5 sm:p-8">
                        {sent ? (
                            <div className="py-4 text-center">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gaming-green/15 text-3xl">✓</div>
                                <h2 className="text-xl font-bold text-ink-900">Message received</h2>
                                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
                                    {flash?.message ?? "Thanks — we read every message and usually reply within a few days."}
                                </p>
                                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSent(false)}
                                        className="rounded-xl border border-ink-900/10 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                                    >
                                        Send another
                                    </button>
                                    <Link
                                        href="/"
                                        className="rounded-xl bg-neon-red px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-neon-red/25 transition hover:bg-neon-red/90"
                                    >
                                        Back to SquadSpawn
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="space-y-5">
                                <div>
                                    <label htmlFor="category" className="mb-1 block text-sm font-semibold text-ink-900">
                                        What&apos;s this about? <span className="text-red-400">*</span>
                                    </label>
                                    <select
                                        id="category"
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c.value} value={c.value}>
                                                {c.label}
                                            </option>
                                        ))}
                                    </select>
                                    {selectedCat && (
                                        <p className="mt-1 text-[11px] text-ink-500">{selectedCat.description}</p>
                                    )}
                                    {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="mb-1 block text-sm font-semibold text-ink-900">
                                            Your name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            maxLength={120}
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                        />
                                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink-900">
                                            Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                        />
                                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="mb-1 block text-sm font-semibold text-ink-900">
                                        Subject <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        id="subject"
                                        type="text"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        required
                                        minLength={3}
                                        maxLength={200}
                                        placeholder="One short line that sums it up"
                                        className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                    />
                                    {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                                </div>

                                <div>
                                    <label htmlFor="body" className="mb-1 block text-sm font-semibold text-ink-900">
                                        Message <span className="text-red-400">*</span>
                                    </label>
                                    <textarea
                                        id="body"
                                        value={data.body}
                                        onChange={(e) => setData('body', e.target.value)}
                                        required
                                        minLength={10}
                                        maxLength={5000}
                                        rows={6}
                                        placeholder={
                                            data.category === 'bug'
                                                ? 'What did you try to do? What happened instead? Which browser / device are you on?'
                                                : data.category === 'creator'
                                                  ? 'Tell us about your channel + games you cover. Links to recent videos / streams help a lot.'
                                                  : data.category === 'partnership'
                                                    ? "What are you pitching? Team, brand, studio? What would a partnership look like?"
                                                    : 'The more detail, the better we can help.'
                                        }
                                        className="w-full resize-none rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                    />
                                    <p className="mt-1 text-[11px] text-ink-500">{data.body.length}/5000</p>
                                    {errors.body && <p className="mt-1 text-xs text-red-500">{errors.body}</p>}
                                </div>

                                {/* Honeypot */}
                                <div className="hidden" aria-hidden>
                                    <label>
                                        Website
                                        <input
                                            type="text"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={data.website}
                                            onChange={(e) => setData('website', e.target.value)}
                                        />
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-neon-red px-5 py-3 text-sm font-bold text-white shadow-lg shadow-neon-red/25 transition hover:bg-neon-red/90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing ? 'Sending…' : 'Send message'}
                                </button>
                                <p className="text-center text-[11px] text-ink-500">
                                    We only use your email to reply to this message. No newsletter, no list-sharing.
                                </p>
                            </form>
                        )}
                    </div>

                    <p className="mt-6 text-center text-xs text-ink-500">
                        Privacy or data-protection request? Pick the <strong>Privacy / GDPR</strong> category above so we can route it right.
                    </p>
                </div>
        </>
    );

    return (
        <>
            <Head title="Contact — SquadSpawn" />
            {isAuthed ? (
                <AuthenticatedLayout>{pageBody as ReactNode}</AuthenticatedLayout>
            ) : (
                <div className="min-h-screen bg-bone-50 text-ink-900">{pageBody}</div>
            )}
        </>
    );
}
