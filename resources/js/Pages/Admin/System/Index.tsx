import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Maint { enabled: boolean; message: string; eta_at: string | null; }

const FEATURE_LABELS: Record<string, { label: string; blurb: string }> = {
    lfg: { label: 'LFG', blurb: 'Looking-for-group posts + chat.' },
    discovery: { label: 'Discovery', blurb: 'Swipe-to-match discovery queue.' },
    community: { label: 'Community', blurb: 'Community posts, comments, votes.' },
    clips: { label: 'Clips', blurb: 'Player highlight clips feed.' },
    chat: { label: 'Chat', blurb: 'Direct-friend + LFG group chat.' },
    registration: { label: 'Registration', blurb: 'New-user sign-ups.' },
};

const TONES: Record<'info' | 'warning' | 'danger', { label: string; dot: string }> = {
    info: { label: 'Info (blue)', dot: 'bg-gaming-cyan' },
    warning: { label: 'Warning (orange)', dot: 'bg-gaming-orange' },
    danger: { label: 'Danger (red)', dot: 'bg-neon-red' },
};

export default function AdminSystemIndex({
    maintenance,
    features,
    flash: flashState,
}: {
    maintenance: Maint;
    features: Record<string, boolean>;
    flash: { message: string | null; tone: 'info' | 'warning' | 'danger' };
}) {
    const { flash } = usePage().props as any;

    // Three small forms so each section can save independently.
    const maintForm = useForm<{ enabled: boolean; message: string; eta_at: string }>({
        enabled: maintenance.enabled,
        message: maintenance.message ?? '',
        eta_at: maintenance.eta_at ?? '',
    });

    const featForm = useForm<{ features: Record<string, boolean> }>({
        features: { ...features },
    });

    const flashForm = useForm<{ message: string; tone: 'info' | 'warning' | 'danger' }>({
        message: flashState.message ?? '',
        tone: flashState.tone,
    });

    const saveMaintenance: FormEventHandler = (e) => {
        e.preventDefault();
        maintForm.post(route('admin.system.maintenance'), { preserveScroll: true });
    };

    const saveFeatures: FormEventHandler = (e) => {
        e.preventDefault();
        featForm.post(route('admin.system.features'), { preserveScroll: true });
    };

    const saveFlash: FormEventHandler = (e) => {
        e.preventDefault();
        flashForm.post(route('admin.system.flash'), { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="System · Admin" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink-900">System controls</h1>
                <p className="mt-1 text-sm text-ink-500">Maintenance mode, feature flags, and the site-wide flash bar. Changes take effect within a second.</p>
            </div>

            {flash?.message && (
                <div className="mb-6 rounded-lg border border-gaming-green/40 bg-gaming-green/10 px-4 py-2.5 text-sm font-semibold text-gaming-green">
                    {flash.message}
                </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
                {/* ── Maintenance mode ───────────────────────── */}
                <form
                    onSubmit={saveMaintenance}
                    className={`rounded-2xl border p-6 transition ${
                        maintForm.data.enabled
                            ? 'border-neon-red/50 bg-neon-red/5 shadow-glow-red'
                            : 'border-ink-900/10 bg-white'
                    }`}
                >
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-ink-900">Maintenance mode</h2>
                            <p className="mt-1 text-xs text-ink-500">
                                When ON, everyone except admins sees a holding page. Admins keep working.
                            </p>
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2">
                            <span className="text-xs font-semibold text-ink-700">{maintForm.data.enabled ? 'ON' : 'OFF'}</span>
                            <input
                                type="checkbox"
                                checked={maintForm.data.enabled}
                                onChange={(e) => maintForm.setData('enabled', e.target.checked)}
                                className="peer sr-only"
                            />
                            <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${maintForm.data.enabled ? 'bg-neon-red' : 'bg-ink-900/20'}`}>
                                <span className={`h-5 w-5 rounded-full bg-white shadow transition ${maintForm.data.enabled ? 'translate-x-5' : ''}`} />
                            </span>
                        </label>
                    </div>

                    <label className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">Message shown to users</label>
                    <textarea
                        rows={2}
                        value={maintForm.data.message}
                        onChange={(e) => maintForm.setData('message', e.target.value)}
                        placeholder="We're rebuilding the squad. Back in a moment."
                        className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                    />

                    <label className="mb-1 mt-4 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">Expected back (optional)</label>
                    <input
                        type="datetime-local"
                        value={maintForm.data.eta_at}
                        onChange={(e) => maintForm.setData('eta_at', e.target.value)}
                        className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                    />
                    <p className="mt-1 text-[10px] text-ink-500">Adds a live countdown on the maintenance page.</p>

                    <button
                        type="submit"
                        disabled={maintForm.processing}
                        className={`mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 ${
                            maintForm.data.enabled ? 'bg-neon-red shadow-glow-red hover:bg-neon-red/90' : 'bg-ink-900/80 hover:bg-ink-900'
                        }`}
                    >
                        {maintForm.processing ? 'Saving…' : maintForm.data.enabled ? 'Save & lock down' : 'Save & keep live'}
                    </button>
                </form>

                {/* ── Flash bar ──────────────────────────────── */}
                <form onSubmit={saveFlash} className="rounded-2xl border border-ink-900/10 bg-white p-6">
                    <h2 className="text-base font-bold text-ink-900">Flash bar</h2>
                    <p className="mt-1 text-xs text-ink-500">
                        Short, non-blocking banner shown at the top of every authenticated page. Good for "Steam API is slow today" moments.
                    </p>

                    <label className="mb-1 mt-4 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">Message (empty = hidden)</label>
                    <input
                        type="text"
                        value={flashForm.data.message}
                        onChange={(e) => flashForm.setData('message', e.target.value)}
                        maxLength={160}
                        placeholder="Steam profiles are loading slowly — we're investigating."
                        className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                    />

                    <label className="mb-1 mt-4 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">Tone</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(TONES) as (keyof typeof TONES)[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => flashForm.setData('tone', t)}
                                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    flashForm.data.tone === t
                                        ? 'border-ink-900/40 bg-bone-100 text-ink-900'
                                        : 'border-ink-900/10 bg-white text-ink-700 hover:border-ink-900/30'
                                }`}
                            >
                                <span className={`h-2 w-2 rounded-full ${TONES[t].dot}`} />
                                {TONES[t].label}
                            </button>
                        ))}
                    </div>

                    {flashForm.data.message && (
                        <div className="mt-4 text-[11px] font-semibold uppercase tracking-widest text-ink-500">Preview</div>
                    )}
                    {flashForm.data.message && (
                        <div className={`mt-1 rounded-lg border px-3 py-2 text-xs font-medium ${
                            flashForm.data.tone === 'info'
                                ? 'border-gaming-cyan/30 bg-gaming-cyan/10 text-gaming-cyan'
                                : flashForm.data.tone === 'warning'
                                    ? 'border-gaming-orange/30 bg-gaming-orange/10 text-gaming-orange'
                                    : 'border-neon-red/30 bg-neon-red/10 text-neon-red'
                        }`}>
                            {flashForm.data.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={flashForm.processing}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-ink-900/80 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-900 disabled:opacity-50"
                    >
                        {flashForm.processing ? 'Saving…' : (flashForm.data.message ? 'Show flash bar' : 'Hide flash bar')}
                    </button>
                </form>

                {/* ── Feature flags ──────────────────────────── */}
                <form onSubmit={saveFeatures} className="rounded-2xl border border-ink-900/10 bg-white p-6 lg:col-span-2">
                    <h2 className="text-base font-bold text-ink-900">Feature flags</h2>
                    <p className="mt-1 text-xs text-ink-500">
                        Turn individual features off when they break or need a pause. Users hitting a disabled area get a friendly "temporarily unavailable" page instead of a stack trace.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {Object.entries(FEATURE_LABELS).map(([key, meta]) => {
                            const on = !!featForm.data.features[key];
                            return (
                                <label
                                    key={key}
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                                        on
                                            ? 'border-gaming-green/40 bg-gaming-green/5'
                                            : 'border-neon-red/30 bg-neon-red/5'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={on}
                                        onChange={(e) => featForm.setData('features', { ...featForm.data.features, [key]: e.target.checked })}
                                        className="peer sr-only"
                                    />
                                    <span className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition ${on ? 'bg-gaming-green' : 'bg-neon-red'}`}>
                                        <span className={`h-4 w-4 rounded-full bg-white shadow transition ${on ? 'translate-x-4' : ''}`} />
                                    </span>
                                    <div className="flex-1">
                                        <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                                            {meta.label}
                                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${on ? 'bg-gaming-green/15 text-gaming-green' : 'bg-neon-red/15 text-neon-red'}`}>
                                                {on ? 'On' : 'Off'}
                                            </span>
                                        </p>
                                        <p className="mt-0.5 text-xs text-ink-500">{meta.blurb}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>

                    <button
                        type="submit"
                        disabled={featForm.processing}
                        className="mt-5 inline-flex items-center justify-center rounded-xl bg-neon-red px-4 py-2.5 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90 disabled:opacity-50"
                    >
                        {featForm.processing ? 'Saving…' : 'Save feature flags'}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
