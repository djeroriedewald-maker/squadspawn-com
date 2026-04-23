import { router, usePage } from '@inertiajs/react';

/**
 * Always-visible red bar shown when an admin is logged in as another
 * user. Click "Return" → POST to /impersonate/stop → redirected back
 * to /admin/users as the admin. Unmissable by design.
 */
export default function ImpersonationBar() {
    const { auth } = usePage().props as any;
    const imp = auth?.impersonator as { id: number; name: string } | null | undefined;
    if (!imp) return null;

    const stop = () => {
        router.post(route('impersonate.stop'), {}, { preserveScroll: false });
    };

    return (
        <div className="sticky top-0 z-[60] bg-neon-red text-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs font-semibold">
                <span className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                    Impersonating this account · <strong>{imp.name}</strong> is the real admin
                </span>
                <button
                    type="button"
                    onClick={stop}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-[11px] font-bold text-white transition hover:bg-white/30"
                >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                    </svg>
                    Return to admin
                </button>
            </div>
        </div>
    );
}
