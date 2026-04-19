import { Head, Link } from '@inertiajs/react';

export default function Redirect({ url, host, isTrusted }: { url: string; host: string; isTrusted: boolean }) {
    return (
        <>
            <Head title="Leaving SquadSpawn" />
            <div className="flex min-h-screen items-center justify-center bg-bone-50 px-4">
                <div className="w-full max-w-md rounded-2xl border border-ink-900/10 bg-white p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                        <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    </div>

                    <h1 className="mb-2 text-xl font-bold text-ink-900">You're leaving SquadSpawn</h1>

                    <p className="mb-4 text-sm text-ink-500">
                        You're about to visit an external website. SquadSpawn is not responsible for the content of external sites.
                    </p>

                    <div className="mb-6 rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-3">
                        <p className="break-all text-sm text-ink-700">{url}</p>
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                            {isTrusted ? (
                                <>
                                    <svg className="h-4 w-4 text-gaming-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                    </svg>
                                    <span className="text-xs font-medium text-gaming-green">Trusted domain</span>
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                    </svg>
                                    <span className="text-xs font-medium text-yellow-500">Unknown domain — proceed with caution</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link
                            href={route('dashboard')}
                            className="flex-1 rounded-xl border border-ink-900/10 px-4 py-3 text-sm font-semibold text-ink-900 transition hover:bg-bone-100"
                        >
                            Go Back
                        </Link>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="flex-1 rounded-xl bg-neon-red px-4 py-3 text-sm font-semibold text-white transition hover:bg-neon-red/80"
                        >
                            Continue
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
