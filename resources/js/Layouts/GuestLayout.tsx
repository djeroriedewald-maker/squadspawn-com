import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="relative flex min-h-screen flex-col items-center bg-ink-900 pt-6 sm:justify-center sm:pt-0">
            {/* Background image */}
            <div className="pointer-events-none absolute inset-0">
                <img src="/images/gamer4.jpg" alt="" className="h-full w-full object-cover opacity-15" />
                <div className="absolute inset-0 bg-gradient-to-b from-ink-900/50 via-ink-900/90 to-ink-900" />
            </div>

            <div className="relative z-10">
                <Link href="/" className="flex flex-col items-center gap-2">
                    <span className="text-3xl font-bold text-neon-red">SquadSpawn</span>
                    <span className="text-xs text-gray-500">Find Your Gaming Squad</span>
                </Link>
            </div>

            <div className="relative z-10 mt-6 w-full overflow-hidden rounded-xl border border-ink-900/5 bg-bone-100/80 glow-border px-6 py-4 shadow-lg backdrop-blur-sm sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
