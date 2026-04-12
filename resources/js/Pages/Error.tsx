import { Head, Link } from '@inertiajs/react';

export default function Error({ status }: { status: number }) {
    const titles: Record<number, string> = {
        403: 'Access Denied',
        404: 'Page Not Found',
        500: 'Server Error',
        503: 'Service Unavailable',
    };

    const descriptions: Record<number, string> = {
        403: "You don't have permission to access this page.",
        404: "The page you're looking for doesn't exist or has been moved.",
        500: 'Something went wrong on our end. Please try again later.',
        503: "We're doing some maintenance. Be right back!",
    };

    const title = titles[status] || 'Error';
    const description = descriptions[status] || 'An unexpected error occurred.';

    return (
        <>
            <Head title={`${status} - ${title}`} />

            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
                <div className="text-center max-w-lg">
                    {/* Large status code */}
                    <p className="text-[8rem] sm:text-[10rem] font-extrabold leading-none text-[#7C3AED] opacity-80 select-none">
                        {status}
                    </p>

                    {/* Title */}
                    <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">
                        {title}
                    </h1>

                    {/* Description */}
                    <p className="mt-4 text-lg text-slate-400">
                        {description}
                    </p>

                    {/* Divider */}
                    <div className="mt-8 mb-8 mx-auto w-24 h-1 rounded bg-gradient-to-r from-[#7C3AED] to-[#22C55E]" />

                    {/* Back to home */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold transition-colors duration-200"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Back to Home
                    </Link>

                    {/* Branding */}
                    <p className="mt-12 text-sm text-slate-600">
                        SquadSpawn
                    </p>
                </div>
            </div>
        </>
    );
}
