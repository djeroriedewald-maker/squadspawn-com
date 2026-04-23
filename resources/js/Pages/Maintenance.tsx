import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Maintenance({ message, eta_at }: { message: string; eta_at: string | null }) {
    const [countdown, setCountdown] = useState<string | null>(null);

    useEffect(() => {
        if (!eta_at) return;
        const tick = () => {
            const diff = new Date(eta_at).getTime() - Date.now();
            if (diff <= 0) {
                setCountdown('any moment now');
                return;
            }
            const hours = Math.floor(diff / 3_600_000);
            const minutes = Math.floor((diff % 3_600_000) / 60_000);
            const seconds = Math.floor((diff % 60_000) / 1000);
            setCountdown(hours > 0
                ? `${hours}h ${minutes}m ${seconds.toString().padStart(2, '0')}s`
                : `${minutes}m ${seconds.toString().padStart(2, '0')}s`);
        };
        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, [eta_at]);

    return (
        <>
            <Head title="Be right back · SquadSpawn" />

            <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#14121A] px-6 text-center">
                {/* Branded atmospheric background — same banner pair used
                    on the login screen so the look stays consistent. */}
                <div className="pointer-events-none absolute inset-0">
                    <picture>
                        <source media="(max-width: 639px)" srcSet="/images/Squadspawn_banner_mobile.jpg" />
                        <img src="/images/Squadspawn_banner_2.jpg" alt="" className="h-full w-full object-cover opacity-55" />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#14121A]/40 via-[#14121A]/70 to-[#14121A]" />
                    <div aria-hidden className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-neon-red/20 blur-3xl" />
                    <div aria-hidden className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-gaming-cyan/15 blur-3xl" />
                </div>

                <div className="relative z-10 max-w-xl">
                    <img
                        src="/images/SquadspawnLOGO.png"
                        alt="SquadSpawn"
                        className="mx-auto mb-8 h-28 w-28 rounded-2xl shadow-2xl ring-1 ring-white/10"
                    />

                    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-neon-red/40 bg-neon-red/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-widest text-neon-red">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-red opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-neon-red" />
                        </span>
                        Maintenance
                    </span>

                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                        Be right <span className="text-neon-red">back</span>.
                    </h1>

                    <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
                        {message}
                    </p>

                    {countdown && (
                        <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 backdrop-blur-sm">
                            <svg className="h-5 w-5 text-gaming-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            <div className="text-left">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Expected back in</p>
                                <p className="font-mono text-lg font-bold text-white">{countdown}</p>
                            </div>
                        </div>
                    )}

                    <p className="mt-10 text-xs text-white/40">
                        Questions? Email <a href="mailto:info@squadspawn.com" className="text-white/70 hover:text-white">info@squadspawn.com</a>
                    </p>
                </div>
            </div>
        </>
    );
}
