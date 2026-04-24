import AdminLayout from '@/Layouts/AdminLayout';
import { gameCoverUrl } from '@/utils/gameImage';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface Stats {
    totalGames: number;
    withCover: number;
    withoutCover: number;
    withDescription: number;
    addedThisWeek: number;
    coveragePct: number;
}

interface GenreRow { genre: string; c: number; }

interface Preset { key: string; label: string; estimatedCalls: number; }

interface Run {
    id: number;
    label: string;
    status: 'queued' | 'running' | 'completed' | 'failed';
    added: number;
    updated: number;
    skipped: number;
    failed: number;
    target: number | null;
    recently_added: string[];
    triggered_by: string | null;
    created_at_human: string;
    started_at_human: string | null;
    finished_at_human: string | null;
    duration_seconds: number | null;
    error: string | null;
}

interface Props {
    stats: Stats;
    topGenres: GenreRow[];
    recent: Run[];
    presets: Preset[];
    hasRunningJob: boolean;
    rawgBudget: { monthlyLimit: number; approxUsedThisMonth: number };
}

const STATUS_TONE: Record<string, string> = {
    queued: 'bg-ink-900/10 text-ink-700',
    running: 'bg-gaming-cyan/15 text-gaming-cyan',
    completed: 'bg-gaming-green/15 text-gaming-green',
    failed: 'bg-red-500/15 text-red-500',
};

function formatDuration(s: number | null): string {
    if (s === null) return '—';
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r > 0 ? `${m}m ${r}s` : `${m}m`;
}

interface AddedGame {
    id: number;
    name: string;
    slug: string;
    cover_image: string | null;
    genre: string | null;
    created_at_human: string;
}

interface RunDetails {
    loading: boolean;
    total: number;
    games: AddedGame[];
}

export default function GameImport({ stats, topGenres, recent, presets, hasRunningJob, rawgBudget }: Props) {
    const flash = (usePage().props as { flash?: { message?: string; error?: string } }).flash;
    const [triggeringKey, setTriggeringKey] = useState<string | null>(null);
    const [runs, setRuns] = useState<Run[]>(recent);
    const [expandedRunId, setExpandedRunId] = useState<number | null>(null);
    const [runDetails, setRunDetails] = useState<Record<number, RunDetails>>({});

    async function toggleRunDetails(run: Run) {
        if (expandedRunId === run.id) {
            setExpandedRunId(null);
            return;
        }
        setExpandedRunId(run.id);
        if (runDetails[run.id]) return; // already fetched
        setRunDetails((prev) => ({ ...prev, [run.id]: { loading: true, total: 0, games: [] } }));
        try {
            const res = await fetch(route('admin.games.import.games', { gameImport: run.id }));
            const data = await res.json();
            setRunDetails((prev) => ({
                ...prev,
                [run.id]: { loading: false, total: data.total ?? 0, games: data.games ?? [] },
            }));
        } catch {
            setRunDetails((prev) => ({ ...prev, [run.id]: { loading: false, total: 0, games: [] } }));
        }
    }

    // Poll for live updates while any queued/running job is in flight.
    const anyLive = runs.some((r) => r.status === 'queued' || r.status === 'running');
    useEffect(() => {
        if (!anyLive) return;
        const t = setInterval(() => {
            router.reload({ only: ['recent', 'hasRunningJob', 'stats'] });
        }, 4000);
        return () => clearInterval(t);
    }, [anyLive]);

    // When the parent prop changes (via router.reload), re-sync local state.
    useEffect(() => setRuns(recent), [recent]);

    function trigger(preset: Preset) {
        if (!confirm(`Start "${preset.label}"? Estimated ~${preset.estimatedCalls} RAWG API calls.`)) return;
        setTriggeringKey(preset.key);
        router.post(route('admin.games.import.trigger'), { preset: preset.key }, {
            preserveScroll: true,
            onFinish: () => setTriggeringKey(null),
        });
    }

    const budgetPct = Math.min(100, Math.round((rawgBudget.approxUsedThisMonth / rawgBudget.monthlyLimit) * 100));

    return (
        <AdminLayout>
            <Head title="Games catalogue · Admin" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-ink-900">Games catalogue</h1>
                <p className="mt-1 text-sm text-ink-500">
                    Grow the library without SSH. Each preset queues a job that runs in the background.{' '}
                    <Link href={route('admin.games')} className="text-neon-red hover:underline">Manage existing games →</Link>
                </p>
            </div>

            {flash?.message && (
                <div className="mb-4 rounded-xl border border-gaming-green/30 bg-gaming-green/5 px-4 py-3 text-sm text-gaming-green">
                    {flash.message}
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
                    {flash.error}
                </div>
            )}

            {/* ── Catalogue stats ──────────────────────────────── */}
            <section className="mb-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-neon-red">Catalogue state</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 dark:bg-bone-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Total games</p>
                        <p className="mt-0.5 text-2xl font-bold text-ink-900">{stats.totalGames.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 dark:bg-bone-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Cover coverage</p>
                        <p className="mt-0.5 text-2xl font-bold text-gaming-green">{stats.coveragePct}%</p>
                        <p className="mt-0.5 text-[10px] text-ink-500">{stats.withCover.toLocaleString()} with · {stats.withoutCover.toLocaleString()} without</p>
                    </div>
                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 dark:bg-bone-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">With description</p>
                        <p className="mt-0.5 text-2xl font-bold text-gaming-cyan">{stats.withDescription.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 dark:bg-bone-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">Added · 7 days</p>
                        <p className="mt-0.5 text-2xl font-bold text-gaming-pink">{stats.addedThisWeek.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-ink-900/10 bg-white p-4 dark:bg-bone-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink-500">RAWG budget</p>
                        <p className="mt-0.5 text-2xl font-bold text-ink-900">
                            {rawgBudget.approxUsedThisMonth.toLocaleString()}<span className="text-sm text-ink-500">/{rawgBudget.monthlyLimit.toLocaleString()}</span>
                        </p>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-ink-900/10">
                            <div className={`h-full ${budgetPct > 80 ? 'bg-red-500' : budgetPct > 50 ? 'bg-gaming-orange' : 'bg-gaming-green'}`} style={{ width: `${budgetPct}%` }} />
                        </div>
                        <p className="mt-1 text-[10px] text-ink-500">Approx this month</p>
                    </div>
                </div>

                {/* Genre breakdown */}
                {topGenres.length > 0 && (
                    <div className="mt-4 rounded-xl border border-ink-900/10 bg-white p-5 dark:bg-bone-100">
                        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-500">By genre · top 10</p>
                        <div className="flex flex-wrap gap-2">
                            {topGenres.map((g) => (
                                <span key={g.genre} className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/5 px-3 py-1 text-xs text-ink-700">
                                    {g.genre}
                                    <span className="font-bold text-ink-900">{g.c}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* ── Trigger presets ──────────────────────────────── */}
            <section className="mb-8">
                <div className="mb-3 flex items-baseline justify-between">
                    <p className="text-xs font-bold uppercase tracking-widest text-gaming-cyan">Trigger a batch</p>
                    {hasRunningJob && (
                        <p className="text-[11px] font-medium text-gaming-orange">
                            ⏳ A batch is currently running — new triggers will be blocked
                        </p>
                    )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {presets.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => trigger(p)}
                            disabled={!!triggeringKey || hasRunningJob}
                            className="group flex items-center justify-between gap-3 rounded-xl border border-ink-900/10 bg-white p-4 text-left transition hover:border-neon-red/40 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none dark:bg-bone-100"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-ink-900">{p.label}</p>
                                <p className="mt-0.5 text-[11px] text-ink-500">~{p.estimatedCalls} API calls</p>
                            </div>
                            {triggeringKey === p.key ? (
                                <span className="text-xs font-semibold text-ink-500">Queuing…</span>
                            ) : (
                                <span className="rounded-lg bg-neon-red/10 px-3 py-1.5 text-xs font-bold text-neon-red group-hover:bg-neon-red group-hover:text-white">
                                    Run →
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Recent runs ──────────────────────────────────── */}
            <section>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-ink-500">Recent runs</p>
                {runs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ink-900/10 bg-bone-100/50 p-12 text-center text-sm text-ink-500">
                        No import runs yet. Trigger a batch above to get started.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {runs.map((run) => {
                            const live = run.status === 'queued' || run.status === 'running';
                            const showCounts = run.status === 'completed' || run.status === 'running';
                            const pct = run.target && run.target > 0
                                ? Math.min(100, Math.round((run.added / run.target) * 100))
                                : null;
                            return (
                                <article
                                    key={run.id}
                                    className={`overflow-hidden rounded-xl border bg-white p-4 transition dark:bg-bone-100 ${
                                        live ? 'border-gaming-cyan/40 shadow-sm shadow-gaming-cyan/5' : 'border-ink-900/10'
                                    }`}
                                >
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_TONE[run.status]}`}>
                                            {run.status}
                                            {live && <span className="ml-1 inline-block animate-pulse">●</span>}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-ink-900">{run.label}</p>
                                            <p className="mt-0.5 text-xs text-ink-500">
                                                Triggered by {run.triggered_by ?? 'system'} · {run.created_at_human}
                                                {run.duration_seconds !== null && <> · ran {formatDuration(run.duration_seconds)}</>}
                                            </p>
                                        </div>
                                        {showCounts && (
                                            <div className="flex flex-wrap gap-2 text-[11px]">
                                                <span className="rounded bg-gaming-green/10 px-2 py-0.5 font-bold text-gaming-green">+{run.added} added</span>
                                                {run.updated > 0 && <span className="rounded bg-gaming-cyan/10 px-2 py-0.5 font-bold text-gaming-cyan">{run.updated} updated</span>}
                                                {run.skipped > 0 && <span className="rounded bg-ink-900/5 px-2 py-0.5 font-medium text-ink-700">{run.skipped} kept</span>}
                                                {run.failed > 0 && <span className="rounded bg-red-500/10 px-2 py-0.5 font-bold text-red-500">{run.failed} failed</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Live progress bar — only while the job is running and we know a target */}
                                    {run.status === 'running' && pct !== null && (
                                        <div className="mt-3">
                                            <div className="mb-1 flex items-center justify-between text-[11px]">
                                                <span className="font-medium text-ink-500">
                                                    {run.added.toLocaleString()} / {run.target!.toLocaleString()} games added
                                                </span>
                                                <span className="font-bold text-gaming-cyan">{pct}%</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-ink-900/10">
                                                <div
                                                    className="h-full bg-gradient-to-r from-gaming-cyan to-gaming-green transition-[width] duration-500 ease-out"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Live "just added" feed — helps admins see concrete progress, not just a number */}
                                    {run.status === 'running' && run.recently_added.length > 0 && (
                                        <div className="mt-3 rounded-lg bg-ink-900/5 p-3">
                                            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-500">Just added</p>
                                            <ul className="space-y-0.5 text-xs text-ink-700">
                                                {run.recently_added.slice(0, 5).map((name, idx) => (
                                                    <li key={`${run.id}-${idx}-${name}`} className="flex items-center gap-1.5 truncate">
                                                        <span className="text-gaming-green">+</span>
                                                        <span className="truncate">{name}</span>
                                                    </li>
                                                ))}
                                                {run.recently_added.length > 5 && (
                                                    <li className="text-[11px] text-ink-500">…and {run.recently_added.length - 5} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {run.error && (
                                        <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-red-500/5 p-3 text-xs text-red-500">{run.error}</pre>
                                    )}

                                    {/* Drill-down: show which games were actually added during this run.
                                        Works even for old runs with +0 counts — queried from games.created_at. */}
                                    {run.status === 'completed' && (
                                        <div className="mt-3 border-t border-ink-900/10 pt-3">
                                            <button
                                                type="button"
                                                onClick={() => toggleRunDetails(run)}
                                                className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-ink-500 hover:text-neon-red"
                                            >
                                                <span>{expandedRunId === run.id ? '▼' : '▶'}</span>
                                                <span>Show games added in this run</span>
                                            </button>

                                            {expandedRunId === run.id && (
                                                <div className="mt-3">
                                                    {runDetails[run.id]?.loading && (
                                                        <p className="text-xs text-ink-500">Loading…</p>
                                                    )}
                                                    {runDetails[run.id] && !runDetails[run.id].loading && runDetails[run.id].total === 0 && (
                                                        <p className="text-xs text-ink-500">
                                                            No games were created in this run's time window.
                                                        </p>
                                                    )}
                                                    {runDetails[run.id] && !runDetails[run.id].loading && runDetails[run.id].total > 0 && (
                                                        <>
                                                            <p className="mb-2 text-xs text-ink-500">
                                                                <span className="font-bold text-gaming-green">{runDetails[run.id].total.toLocaleString()}</span> games added
                                                                {runDetails[run.id].total > runDetails[run.id].games.length && (
                                                                    <span className="text-ink-500"> · showing first {runDetails[run.id].games.length}</span>
                                                                )}
                                                            </p>
                                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                                                {runDetails[run.id].games.map((g) => (
                                                                    <div key={g.id} className="flex items-center gap-2 rounded-lg bg-ink-900/5 p-1.5">
                                                                        {g.cover_image ? (
                                                                            <img
                                                                                src={gameCoverUrl(g.cover_image, 'thumb') ?? undefined}
                                                                                alt=""
                                                                                loading="lazy"
                                                                                decoding="async"
                                                                                className="h-10 w-10 shrink-0 rounded object-cover"
                                                                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                                            />
                                                                        ) : (
                                                                            <div className="h-10 w-10 shrink-0 rounded bg-ink-900/10" />
                                                                        )}
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate text-xs font-semibold text-ink-900">{g.name}</p>
                                                                            {g.genre && <p className="truncate text-[10px] text-ink-500">{g.genre}</p>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <p className="mt-8 text-center text-[11px] text-ink-500">
                Rule of thumb: 5.000 unique games ≈ ~5.100 RAWG calls. Your free tier is 20k/mo — plenty of headroom.
            </p>
        </AdminLayout>
    );
}
