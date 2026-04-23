import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';

interface PathInfo {
    artisan: string;
    artisan_exists: boolean;
    artisan_raw: string;
    uses_symlink: boolean;
    php_binary: string;
    base_path: string;
    app_timezone: string;
    now_server: string;
}

interface Pending {
    id: number;
    title: string;
    scheduled_at: string | null;
    is_due: boolean;
}

interface Scheduler {
    last_run_at: string | null;
    healthy: boolean;
}

export default function Diagnostics({
    paths,
    suggested_cron,
    scheduler,
    pending_scheduled,
}: {
    paths: PathInfo;
    suggested_cron: string;
    scheduler: Scheduler;
    pending_scheduled: Pending[];
}) {
    const [copied, setCopied] = useState(false);
    const [running, setRunning] = useState(false);
    const [runResult, setRunResult] = useState<{ ok: boolean; message: string } | null>(null);

    const copyCommand = async () => {
        try {
            await navigator.clipboard.writeText(suggested_cron);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {}
    };

    const runSchedulerNow = async () => {
        if (!confirm('Run the scheduler command right now? Any overdue scheduled broadcasts will fire immediately.')) return;
        setRunning(true);
        setRunResult(null);
        try {
            const res = await axios.post(route('admin.broadcasts.diagnostics.run'));
            setRunResult({ ok: true, message: res.data.output ?? 'Done.' });
            // Reload the page to refresh heartbeat + pending list.
            setTimeout(() => router.reload(), 900);
        } catch (err: any) {
            setRunResult({ ok: false, message: err?.response?.data?.error ?? 'Run failed.' });
        } finally {
            setRunning(false);
        }
    };

    return (
        <AdminLayout>
            <Head title="Scheduler diagnostics" />

            <div className="mb-6">
                <Link href={route('admin.broadcasts.index')} className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-neon-red">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to broadcasts
                </Link>
                <h1 className="mt-2 text-2xl font-bold text-ink-900">Scheduler diagnostics</h1>
                <p className="mt-1 text-sm text-ink-500">
                    Everything you need to confirm the cron is running correctly — no SSH required.
                </p>
            </div>

            {/* ── Health ─────────────────────────────────────── */}
            <div
                className={`mb-6 flex items-start gap-3 rounded-xl border p-5 ${
                    scheduler.healthy
                        ? 'border-gaming-green/30 bg-gaming-green/5'
                        : 'border-gaming-orange/40 bg-gaming-orange/5'
                }`}
            >
                <div
                    className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-full ${
                        scheduler.healthy
                            ? 'bg-gaming-green/20 text-gaming-green'
                            : 'bg-gaming-orange/20 text-gaming-orange'
                    }`}
                >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {scheduler.healthy ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008M5.07 19.5h13.86a2.25 2.25 0 0 0 1.95-3.375L13.95 3.375a2.25 2.25 0 0 0-3.9 0L3.12 16.125A2.25 2.25 0 0 0 5.07 19.5Z" />
                        )}
                    </svg>
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-bold ${scheduler.healthy ? 'text-gaming-green' : 'text-gaming-orange'}`}>
                        {scheduler.healthy ? 'Scheduler is running' : 'Scheduler is NOT running'}
                    </p>
                    <p className="mt-1 text-xs text-ink-500">
                        {scheduler.last_run_at
                            ? <>Last heartbeat: <strong className="text-ink-700">{new Date(scheduler.last_run_at).toLocaleString()}</strong></>
                            : 'No heartbeat recorded yet. Set up the cron below and it should turn green within 60 seconds.'}
                    </p>
                </div>
            </div>

            {/* ── Run scheduler now (manual trigger) ────────── */}
            <div className="mb-6 rounded-2xl border border-gaming-cyan/30 bg-gaming-cyan/5 p-6">
                <h2 className="text-sm font-bold text-ink-900">Run scheduler manually</h2>
                <p className="mt-1 text-xs text-ink-500">
                    Invoke the <code className="rounded bg-white px-1 py-0.5">broadcasts:dispatch-scheduled</code> artisan command from here, so you can tell "the code works, Forge cron isn't firing" apart from "the code itself is broken". If the heartbeat flips to green after this, the problem is 100% the cron setup.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={runSchedulerNow}
                        disabled={running}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gaming-cyan px-4 py-2 text-sm font-bold text-white transition hover:bg-gaming-cyan/90 disabled:opacity-50"
                    >
                        {running ? 'Running…' : '▶ Run scheduler now'}
                    </button>
                </div>
                {runResult && (
                    <pre className={`mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-xs ${
                        runResult.ok
                            ? 'border-gaming-green/30 bg-gaming-green/5 text-gaming-green'
                            : 'border-red-500/40 bg-red-500/5 text-red-600'
                    }`}>
                        {runResult.message}
                    </pre>
                )}
            </div>

            {/* ── Exact cron command ─────────────────────────── */}
            <div className="mb-6 rounded-2xl border border-ink-900/10 bg-white p-6">
                <h2 className="text-sm font-bold text-ink-900">Cron command for Forge</h2>
                <p className="mt-1 text-xs text-ink-500">
                    Paste this exactly into Forge → <em>your server</em> → <em>Scheduler</em> tab → <em>Add Scheduled Job</em>. User: <code className="rounded bg-bone-100 px-1 py-0.5">forge</code>. Frequency: <code className="rounded bg-bone-100 px-1 py-0.5">Every minute</code>.
                </p>

                <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-900/10 bg-bone-50 p-3 font-mono text-xs">
                    <code className="flex-1 break-all text-ink-900">{suggested_cron}</code>
                    <button
                        type="button"
                        onClick={copyCommand}
                        className="rounded-lg bg-neon-red px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neon-red/90"
                    >
                        {copied ? '✓ Copied' : 'Copy'}
                    </button>
                </div>

                {paths.uses_symlink && (
                    <p className="mt-3 rounded-lg border border-gaming-cyan/30 bg-gaming-cyan/5 px-3 py-2 text-xs text-gaming-cyan">
                        <strong>Note:</strong> detected zero-downtime deploys — the cron points at <code>/current/artisan</code> (the stable symlink). This survives every redeploy.
                    </p>
                )}

                {!paths.artisan_exists && (
                    <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-xs text-red-600">
                        <strong>Warning:</strong> this server cannot find <code>{paths.artisan}</code>. Double-check the symlink setup in Forge — the `current` symlink may not be created yet.
                    </p>
                )}
            </div>

            {/* ── Pending broadcasts ─────────────────────────── */}
            {pending_scheduled.length > 0 && (
                <div className="mb-6 rounded-2xl border border-ink-900/10 bg-white p-6">
                    <h2 className="text-sm font-bold text-ink-900">
                        Pending scheduled broadcasts ({pending_scheduled.length})
                    </h2>
                    <p className="mt-1 text-xs text-ink-500">
                        Should have already fired if scheduled_at is in the past AND the scheduler is green.
                    </p>
                    <ul className="mt-3 divide-y divide-ink-900/5">
                        {pending_scheduled.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                                <div className="min-w-0 flex-1">
                                    <Link href={route('admin.broadcasts.edit', p.id)} className="font-semibold text-ink-900 hover:text-neon-red">
                                        {p.title}
                                    </Link>
                                    <p className="text-[11px] text-ink-500">
                                        Fires {p.scheduled_at ? new Date(p.scheduled_at).toLocaleString() : '—'}
                                    </p>
                                </div>
                                {p.is_due && (
                                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                        OVERDUE
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ── Paths + meta ───────────────────────────────── */}
            <div className="mb-6 rounded-2xl border border-ink-900/10 bg-white p-6">
                <h2 className="text-sm font-bold text-ink-900">Server paths &amp; config</h2>
                <dl className="mt-3 space-y-2 text-xs">
                    <Row label="Artisan file" value={paths.artisan} ok={paths.artisan_exists} />
                    <Row label="PHP binary" value={paths.php_binary} />
                    <Row label="Base path" value={paths.base_path} />
                    <Row label="App timezone" value={paths.app_timezone} />
                    <Row label="Server time now" value={new Date(paths.now_server).toLocaleString() + ' (your local)'} />
                </dl>
            </div>
        </AdminLayout>
    );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
    return (
        <div className="flex flex-wrap items-start gap-3">
            <dt className="w-36 shrink-0 text-ink-500">{label}</dt>
            <dd className="flex-1 font-mono text-ink-900 break-all">
                {value}
                {ok === true && <span className="ml-2 text-gaming-green">✓</span>}
                {ok === false && <span className="ml-2 text-red-500">✗ missing</span>}
            </dd>
        </div>
    );
}
