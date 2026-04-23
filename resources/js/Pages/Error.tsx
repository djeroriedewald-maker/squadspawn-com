import { Head, Link } from '@inertiajs/react';

export default function Error({ status }: { status: number }) {
    const titles: Record<number, string> = {
        403: 'Access denied',
        404: 'Page not found',
        500: 'Something broke on our end',
        503: 'We\'re doing some work',
    };

    const descriptions: Record<number, string> = {
        403: "You don't have permission to view that page. If you think that's a mistake, try signing in again.",
        404: "That URL didn't match anything on SquadSpawn. It might have moved, or the link was typo'd.",
        500: "Our server hit an unexpected bump. We've been notified — please try again in a minute.",
        503: "SquadSpawn is briefly in maintenance mode. Hang tight — we'll be back shortly.",
    };

    const title = titles[status] || 'Error';
    const description = descriptions[status] || 'An unexpected error occurred.';

    return (
        <>
            <Head title={`${status} · ${title}`} />

            <div className="flex min-h-screen items-center justify-center bg-bone-50 px-4">
                <div className="max-w-lg text-center">
                    {/* Status code */}
                    <p className="select-none text-[8rem] font-extrabold leading-none text-neon-red sm:text-[10rem]">
                        {status}
                    </p>

                    <h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">
                        {title}
                    </h1>

                    <p className="mt-4 text-base text-ink-500">
                        {description}
                    </p>

                    <div className="mx-auto mt-8 mb-8 h-1 w-24 rounded bg-gradient-to-r from-neon-red to-gaming-green" />

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded-lg bg-neon-red px-6 py-3 font-semibold text-white shadow-lg shadow-neon-red/25 transition hover:bg-neon-red/90"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Back home
                        </Link>
                        <Link
                            href="/help"
                            className="inline-flex items-center gap-2 rounded-lg border border-ink-900/10 bg-white px-6 py-3 font-semibold text-ink-900 transition hover:border-neon-red/30 hover:text-neon-red"
                        >
                            Help centre
                        </Link>
                    </div>

                    <p className="mt-12 text-xs text-gray-500">
                        SquadSpawn
                    </p>
                </div>
            </div>
        </>
    );
}
