import { getConsent, hasDecided, saveConsent } from '@/utils/cookieConsent';
import { useEffect, useState } from 'react';

type View = 'banner' | 'details' | 'hidden';

export default function CookieBanner() {
    const [view, setView] = useState<View>('hidden');
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    useEffect(() => {
        if (!hasDecided()) {
            setView('banner');
        }
        const existing = getConsent();
        if (existing) {
            setAnalytics(existing.analytics);
            setMarketing(existing.marketing);
        }
        // Listen for "Cookie Settings" trigger anywhere on the site
        const openHandler = () => {
            const c = getConsent();
            setAnalytics(c?.analytics ?? false);
            setMarketing(c?.marketing ?? false);
            setView('details');
        };
        window.addEventListener('open-cookie-settings', openHandler);
        return () => window.removeEventListener('open-cookie-settings', openHandler);
    }, []);

    function acceptAll() {
        saveConsent({ analytics: true, marketing: true });
        setView('hidden');
    }

    function rejectAll() {
        saveConsent({ analytics: false, marketing: false });
        setView('hidden');
    }

    function saveChoice() {
        saveConsent({ analytics, marketing });
        setView('hidden');
    }

    if (view === 'hidden') return null;

    if (view === 'banner') {
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ink-900/10 bg-white p-4 shadow-lg sm:p-6">
                <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="flex-1 text-sm text-ink-700">
                        <p className="font-semibold text-ink-900">We value your privacy.</p>
                        <p className="mt-1">
                            SquadSpawn uses functional cookies to keep you signed in. With your permission
                            we can also use analytics and marketing cookies to improve the site. You can change
                            your choice any time via Cookie Settings. Read our{' '}
                            <a href="/cookie-policy" className="text-neon-red hover:underline">Cookie Policy</a>.
                        </p>
                    </div>
                    <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:flex-nowrap">
                        <button
                            onClick={() => setView('details')}
                            className="flex-1 rounded-lg border border-ink-900/10 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-bone-100 sm:flex-none"
                        >
                            Customise
                        </button>
                        <button
                            onClick={rejectAll}
                            className="flex-1 rounded-lg border border-ink-900/10 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-bone-100 sm:flex-none"
                        >
                            Reject all
                        </button>
                        <button
                            onClick={acceptAll}
                            className="flex-1 rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/90 sm:flex-none"
                        >
                            Accept all
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // view === 'details'
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 sm:items-center sm:p-4">
            <div className="w-full max-w-xl rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
                <div className="border-b border-ink-900/10 p-5">
                    <h2 className="text-lg font-bold text-ink-900">Cookie Settings</h2>
                    <p className="mt-1 text-xs text-ink-500">
                        Choose which cookies SquadSpawn may use. Functional cookies are required and
                        can't be turned off.
                    </p>
                </div>

                <div className="space-y-4 p-5">
                    <Row
                        title="Functional"
                        description="Required to keep you signed in, protect against CSRF, and remember this cookie choice. Always on."
                        enabled
                        locked
                    />
                    <Row
                        title="Analytics"
                        description="Anonymised usage insights so we can see which features help people find a squad and which don't."
                        enabled={analytics}
                        onChange={setAnalytics}
                    />
                    <Row
                        title="Marketing"
                        description="Personalised offers, referral tracking and performance on external ads. Off by default."
                        enabled={marketing}
                        onChange={setMarketing}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-ink-900/10 p-4">
                    <button
                        onClick={rejectAll}
                        className="rounded-lg border border-ink-900/10 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-bone-100"
                    >
                        Reject all
                    </button>
                    <button
                        onClick={acceptAll}
                        className="rounded-lg border border-ink-900/10 px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-bone-100"
                    >
                        Accept all
                    </button>
                    <button
                        onClick={saveChoice}
                        className="rounded-lg bg-neon-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/90"
                    >
                        Save choices
                    </button>
                </div>
            </div>
        </div>
    );
}

function Row({
    title,
    description,
    enabled,
    onChange,
    locked,
}: {
    title: string;
    description: string;
    enabled: boolean;
    onChange?: (v: boolean) => void;
    locked?: boolean;
}) {
    return (
        <label className={`flex items-start gap-3 rounded-xl border border-ink-900/10 p-3 ${locked ? 'bg-bone-50' : 'cursor-pointer hover:bg-bone-50'}`}>
            <div className="mt-0.5 shrink-0">
                <div
                    role="switch"
                    aria-checked={enabled}
                    aria-disabled={locked || undefined}
                    onClick={(e) => {
                        e.preventDefault();
                        if (!locked && onChange) onChange(!enabled);
                    }}
                    className={`flex h-5 w-9 items-center rounded-full transition ${
                        enabled ? 'bg-neon-red' : 'bg-ink-900/20'
                    } ${locked ? 'opacity-60' : 'cursor-pointer'}`}
                >
                    <span
                        className={`h-4 w-4 rounded-full bg-white shadow transition ${
                            enabled ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                    />
                </div>
            </div>
            <div className="flex-1 text-sm">
                <div className="font-semibold text-ink-900">
                    {title}
                    {locked && <span className="ml-2 text-[10px] font-medium uppercase tracking-widest text-ink-500">Always on</span>}
                </div>
                <div className="mt-0.5 text-xs text-ink-500">{description}</div>
            </div>
        </label>
    );
}
