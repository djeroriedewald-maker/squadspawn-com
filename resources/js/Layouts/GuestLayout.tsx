import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-navy-900 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/" className="text-3xl font-bold text-gaming-purple">
                    SquadSpawn
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden rounded-xl border border-white/10 bg-navy-800 px-6 py-4 shadow-lg sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
