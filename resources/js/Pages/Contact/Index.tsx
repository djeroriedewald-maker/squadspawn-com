import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface Props {
    prefillName: string;
    prefillEmail: string;
}

export default function ContactIndex({ prefillName, prefillEmail }: Props) {
    const flash = (usePage().props as { flash?: { message?: string } }).flash;
    const [sent, setSent] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<{
        name: string;
        email: string;
        subject: string;
        body: string;
        website: string;
    }>({
        name: prefillName,
        email: prefillEmail,
        subject: '',
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
            },
        });
    };

    return (
        <>
            <Head title="Contact — SquadSpawn" />

            <div className="min-h-screen bg-bone-50 text-ink-900">
                <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
                    <Link href="/" className="text-2xl font-bold text-neon-red">SquadSpawn</Link>
                    <Link href="/" className="text-sm text-ink-500 hover:text-ink-900">← Back</Link>
                </nav>

                <div className="mx-auto max-w-2xl px-6 py-12 lg:px-12">
                    <div className="mb-8 text-center">
                        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-gaming-cyan/30 bg-gaming-cyan/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-gaming-cyan">
                            We read every one
                        </span>
                        <h1 className="text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">Get in touch</h1>
                        <p className="mx-auto mt-3 max-w-lg text-sm text-ink-500 sm:text-base">
                            Feedback, bug reports, creator partnerships, press, legal — anything. Your message lands directly in the SquadSpawn admin inbox. No ticket queue, no auto-responder.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6 shadow-lg shadow-neon-red/5 sm:p-8">
                        {sent ? (
                            <div className="text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gaming-green/10 text-2xl">✓</div>
                                <h2 className="text-xl font-bold text-ink-900">Message sent</h2>
                                <p className="mt-2 text-sm text-ink-500">
                                    {flash?.message ?? "Thanks — we read every message and usually reply within a few days."}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setSent(false)}
                                    className="mt-4 text-sm text-neon-red hover:text-neon-red/80"
                                >
                                    Send another
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="name" className="mb-1 block text-sm font-semibold text-ink-900">Your name</label>
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
                                        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-ink-900">Email</label>
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
                                    <label htmlFor="subject" className="mb-1 block text-sm font-semibold text-ink-900">Subject</label>
                                    <input
                                        id="subject"
                                        type="text"
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        required
                                        minLength={3}
                                        maxLength={200}
                                        placeholder="What's this about?"
                                        className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red"
                                    />
                                    {errors.subject && <p className="mt-1 text-xs text-red-500">{errors.subject}</p>}
                                </div>

                                <div>
                                    <label htmlFor="body" className="mb-1 block text-sm font-semibold text-ink-900">Message</label>
                                    <textarea
                                        id="body"
                                        value={data.body}
                                        onChange={(e) => setData('body', e.target.value)}
                                        required
                                        minLength={10}
                                        maxLength={5000}
                                        rows={6}
                                        placeholder="The more detail you give, the easier it is to help. For bug reports, what were you doing + which browser you were on helps a lot."
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
                                    We'll only use your email to reply to this message.
                                </p>
                            </form>
                        )}
                    </div>

                    <p className="mt-6 text-center text-xs text-ink-500">
                        For urgent privacy / data-protection requests specifically, you can also email{' '}
                        <a href="mailto:info@squadspawn.com" className="text-neon-red hover:underline">info@squadspawn.com</a>.
                    </p>
                </div>
            </div>
        </>
    );
}
