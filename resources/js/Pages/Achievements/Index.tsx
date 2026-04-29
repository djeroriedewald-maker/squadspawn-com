import SeoHead from '@/Components/SeoHead';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Achievement, PageProps } from '@/types';
import {
    achievementColorClasses as colorClasses,
    getAchievementIcon,
    getTierStyle,
} from '@/utils/achievements';
import { useEffect, useState } from 'react';

const levelColors = ['text-ink-500', 'text-gaming-green', 'text-gaming-cyan', 'text-neon-red', 'text-gaming-pink', 'text-yellow-400'];

interface ProgressItem {
    current: number;
    target: number;
    label: string;
}

interface XpLevel {
    level: number;
    name: string;
    xp: number;
}

interface LegendGate {
    ok: boolean;
    current: number;
    target: number;
    label: string;
}

// Per-tile image lives at /images/achievements/{slug}.jpg. When that's
// missing the tile falls back to the per-tier generic image so a freshly
// added achievement looks intentional even before its custom art exists.
function bgImageFor(slug: string): string {
    return `/images/achievements/${slug}.jpg`;
}

export default function Index({
    achievements,
    earnedIds,
    earnedDates,
    progress,
    userXp,
    currentLevel,
    nextLevel,
    levels,
    legendGates,
}: PageProps<{
    achievements: Achievement[];
    earnedIds: number[];
    earnedDates: Record<number, string>;
    totalPoints: number;
    earnedPoints: number;
    progress: Record<string, ProgressItem>;
    userXp: number;
    currentLevel: XpLevel;
    nextLevel: XpLevel | null;
    levels: XpLevel[];
    legendGates: Record<string, LegendGate> | null;
}>) {
    const earnedCount = earnedIds.length;
    const totalCount = achievements.length;

    const xpInLevel = nextLevel ? userXp - currentLevel.xp : 0;
    const xpNeeded = nextLevel ? nextLevel.xp - currentLevel.xp : 1;
    const levelProgress = nextLevel ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

    // Sort tiles by tier asc (bronze → platinum) then by points asc within
    // a tier so the page reads as a difficulty ladder. Earned-vs-locked
    // doesn't influence order — keeps the layout stable session to session.
    const tierOrder: Record<string, number> = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
    const sortedAchievements = [...achievements].sort((a, b) => {
        const ta = tierOrder[a.tier || 'bronze'] ?? 0;
        const tb = tierOrder[b.tier || 'bronze'] ?? 0;
        if (ta !== tb) return ta - tb;
        return a.points - b.points;
    });

    // Selected achievement powers the detail modal. ESC to close, plus
    // body-scroll lock while open so a long page doesn't keep scrolling
    // behind the dialog.
    const [selected, setSelected] = useState<Achievement | null>(null);
    useEffect(() => {
        if (!selected) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [selected]);

    return (
        <AuthenticatedLayout>
            <SeoHead fallbackTitle="Achievements" />

            {/* Hero */}
            <div className="relative h-32 overflow-hidden sm:h-40">
                <img src="/images/gamer8.jpg" alt="" className="h-full w-full object-cover opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-bone-50/10 via-bone-50/50 to-bone-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">Achievements</h1>
                        <p className="mt-1 text-sm text-ink-500">{earnedCount}/{totalCount} unlocked</p>
                    </div>
                </div>
            </div>

            <div className="py-8">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

                    {/* XP Level Card */}
                    <div className="mb-8 overflow-hidden rounded-2xl border border-ink-900/10 bg-white">
                        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-bone-100 text-3xl font-black ${levelColors[currentLevel.level - 1] || 'text-ink-900'}`}>
                                    {currentLevel.level}
                                </div>
                                <div>
                                    <p className={`text-lg font-bold ${levelColors[currentLevel.level - 1] || 'text-ink-900'}`}>{currentLevel.name}</p>
                                    <p className="text-sm text-ink-500">{userXp.toLocaleString()} XP earned</p>
                                </div>
                            </div>

                            <div className="flex-1">
                                {nextLevel ? (
                                    <>
                                        <div className="mb-1.5 flex items-center justify-between text-xs">
                                            <span className="text-ink-500">Level {currentLevel.level}</span>
                                            <span className="font-semibold text-ink-700">{xpInLevel.toLocaleString()}/{xpNeeded.toLocaleString()} XP to Level {nextLevel.level}</span>
                                            <span className="text-ink-500">{nextLevel.name}</span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-bone-100">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-neon-red via-gaming-cyan to-yellow-400 transition-all duration-700"
                                                style={{ width: `${levelProgress}%` }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-lg bg-yellow-400/10 px-4 py-2 text-center text-sm font-bold text-yellow-400">
                                        Living Legend — max tier reached
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex border-t border-ink-900/5">
                            {(levels || []).map((lvl: XpLevel) => (
                                <div key={lvl.level} className={`flex-1 py-2.5 text-center text-[10px] ${userXp >= lvl.xp ? levelColors[lvl.level - 1] + ' font-bold' : 'text-gray-600'}`}>
                                    <p>{lvl.name}</p>
                                    <p>{lvl.xp.toLocaleString()} XP</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend gates — only shown to Champion+ users so we don't
                        spoil the journey for newer accounts. */}
                    {legendGates && (
                        <div className="mb-8 overflow-hidden rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-yellow-400/5 via-bone-100 to-fuchsia-400/5 p-6">
                            <div className="mb-3 flex items-center gap-3">
                                <span className="rounded-full bg-yellow-400/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest text-yellow-400 ring-1 ring-yellow-400/40">
                                    Legend gates
                                </span>
                                <p className="text-xs text-ink-500">XP alone won't get you there — Legend takes a clean record and real community trust.</p>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {Object.entries(legendGates).map(([key, gate]) => (
                                    <div key={key} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${gate.ok ? 'border-gaming-green/30 bg-gaming-green/5' : 'border-ink-900/10 bg-white'}`}>
                                        <span className="flex items-center gap-2 text-ink-700">
                                            {gate.ok ? (
                                                <svg className="h-4 w-4 text-gaming-green" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            ) : (
                                                <svg className="h-4 w-4 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                                                    <circle cx="12" cy="12" r="9" />
                                                </svg>
                                            )}
                                            {gate.label}
                                        </span>
                                        <span className={`text-xs font-bold ${gate.ok ? 'text-gaming-green' : 'text-ink-500'}`}>
                                            {gate.current}{gate.target ? ` / ${gate.target}` : ''}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* XP Sources info */}
                    <div className="mb-6 rounded-xl border border-ink-900/10 bg-white p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">How to earn XP</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                                { action: 'Daily login', xp: '+5' },
                                { action: 'Host LFG', xp: '+25' },
                                { action: 'Join LFG', xp: '+10' },
                                { action: 'Give rating', xp: '+5' },
                                { action: '5-star received', xp: '+30' },
                                { action: 'New friend', xp: '+15' },
                                { action: 'Share clip', xp: '+10' },
                                { action: 'Unlock achievement', xp: 'varies' },
                            ].map((item) => (
                                <div key={item.action} className="rounded-lg bg-bone-50 px-3 py-2">
                                    <p className="text-[11px] font-medium text-ink-900">{item.action}</p>
                                    <p className="text-[10px] text-gaming-green">{item.xp}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievement Grid — image-backed tiles, sorted by tier */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {sortedAchievements.map((achievement) => {
                            const isEarned = earnedIds.includes(achievement.id);
                            const colors = colorClasses[achievement.color] || colorClasses.purple;
                            const tier = getTierStyle(achievement.tier);
                            const earnedDate = earnedDates[achievement.id];
                            const prog = progress[achievement.slug];
                            const progPercent = prog ? Math.min((prog.current / prog.target) * 100, 100) : 0;

                            return (
                                <button
                                    key={achievement.id}
                                    type="button"
                                    onClick={() => setSelected(achievement)}
                                    aria-label={`View ${achievement.name} achievement details`}
                                    // Hard-coded `bg-black` keeps the canvas
                                    // dark even when the locked image's
                                    // opacity lets the page bg show through
                                    // — without it, light-mode tiles looked
                                    // milky because cream bone-50 was
                                    // bleeding past the translucent image.
                                    className={`group relative isolate flex aspect-[4/3] cursor-pointer flex-col justify-end overflow-hidden rounded-xl border bg-black text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-neon-red/40 focus:ring-offset-2 focus:ring-offset-bone-50 ${
                                        isEarned
                                            ? `${tier.ring} ${tier.glow}`
                                            : 'border-white/5'
                                    }`}
                                >
                                    {/* Background image. Earned = full strength.
                                        Locked = grayscale + dimmed so it's clearly
                                        not yet yours but still recognisable. */}
                                    <img
                                        src={bgImageFor(achievement.slug)}
                                        alt=""
                                        loading="lazy"
                                        decoding="async"
                                        onError={(e) => {
                                            const img = e.currentTarget;
                                            if (!img.dataset.fallback) {
                                                img.dataset.fallback = '1';
                                                img.src = tier.fallbackImage;
                                            } else if (img.dataset.fallback === '1') {
                                                img.dataset.fallback = '2';
                                                img.style.display = 'none';
                                            }
                                        }}
                                        className={`absolute inset-0 -z-10 h-full w-full object-cover transition duration-500 ${isEarned ? 'group-hover:scale-105' : 'opacity-55 grayscale brightness-50'}`}
                                    />
                                    {/* Bottom-only dark gradient so the title/desc
                                        stays readable. Hardcoded to black/transparent
                                        — `ink-900` flips to bone in dark mode and
                                        would create a white wash over the photo.
                                        Locked tiles get a stronger gradient because
                                        their grayscale image lightens up in light
                                        mode and washes out the white text. */}
                                    <div className={`absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t to-transparent ${isEarned ? 'from-black/90 via-black/45' : 'from-black/95 via-black/70'}`} />

                                    {/* Locked: prominent center lock badge so it's
                                        unmistakable at a glance. */}
                                    {!isEarned && (
                                        <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/80 shadow-lg ring-1 ring-white/15 backdrop-blur-sm">
                                                <svg className="h-7 w-7 text-white/95" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}

                                    {/* Top row: tier pill + (earned-only) check.
                                        Pill carries its own solid tier bg so
                                        the colour reads as identity AND the
                                        white label text never has contrast
                                        issues against any photo. */}
                                    <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest shadow-md ring-1 ${tier.pill}`}>
                                            {tier.label}
                                        </span>
                                        {isEarned && (
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gaming-green text-white shadow-md ring-1 ring-white/20">
                                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </span>
                                        )}
                                    </div>

                                    {/* Bottom info block — sits over the dark gradient.
                                        Text uses a stroke-style stack (hard 2px outline
                                        + soft halo) so white type stays crisp even on
                                        locked tiles where the grayscale image can light
                                        up to mid-grey in light mode. */}
                                    <div className="relative p-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-2xl drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">{getAchievementIcon(achievement.icon)}</span>
                                            <h3 className="truncate text-base font-bold text-white [text-shadow:_0_0_2px_rgba(0,0,0,1),_0_2px_8px_rgba(0,0,0,0.85)]">
                                                {achievement.name}
                                            </h3>
                                        </div>
                                        <p className="mt-1 line-clamp-2 text-xs font-medium text-white [text-shadow:_0_0_2px_rgba(0,0,0,1),_0_1px_4px_rgba(0,0,0,0.85)]">
                                            {achievement.description}
                                        </p>

                                        {!isEarned && prog && (
                                            <div className="mt-2.5">
                                                <div className="mb-1 flex items-center justify-between text-[10px] font-semibold text-white [text-shadow:_0_0_2px_rgba(0,0,0,1),_0_1px_2px_rgba(0,0,0,0.85)]">
                                                    <span>{Math.min(prog.current, prog.target)}/{prog.target} {prog.label}</span>
                                                    <span>{Math.round(progPercent)}%</span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-black/70 ring-1 ring-white/15">
                                                    <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${progPercent}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-2.5 flex items-center justify-between">
                                            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold shadow-md ${tier.accent}`}>
                                                +{achievement.points} XP
                                            </span>
                                            {isEarned && earnedDate && (
                                                <span className="text-[10px] font-semibold text-white [text-shadow:_0_0_2px_rgba(0,0,0,1),_0_1px_2px_rgba(0,0,0,0.85)]">{new Date(earnedDate).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Detail modal — opens on tile click. Click on the dark
                backdrop closes it; the inner card stops propagation so
                a click inside doesn't bubble back up. ESC + body-scroll
                lock are wired in the useEffect above. */}
            {selected && (() => {
                const tier = getTierStyle(selected.tier);
                const colors = colorClasses[selected.color] || colorClasses.purple;
                const isEarned = earnedIds.includes(selected.id);
                const earnedDate = earnedDates[selected.id];
                const prog = progress[selected.slug];
                const progPercent = prog ? Math.min((prog.current / prog.target) * 100, 100) : 0;

                return (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-sm"
                        onClick={() => setSelected(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="achievement-modal-title"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className={`relative w-full max-w-lg overflow-hidden rounded-2xl border bg-black shadow-2xl ${
                                isEarned ? tier.ring : 'border-white/10'
                            }`}
                        >
                            {/* Close button */}
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                aria-label="Close"
                                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white shadow-md ring-1 ring-white/15 backdrop-blur-sm transition hover:bg-black/90"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {/* Hero image */}
                            <div className="relative aspect-[16/9] bg-black">
                                <img
                                    src={bgImageFor(selected.slug)}
                                    alt=""
                                    onError={(e) => {
                                        const img = e.currentTarget;
                                        if (!img.dataset.fallback) {
                                            img.dataset.fallback = '1';
                                            img.src = tier.fallbackImage;
                                        } else if (img.dataset.fallback === '1') {
                                            img.dataset.fallback = '2';
                                            img.style.display = 'none';
                                        }
                                    }}
                                    className={`h-full w-full object-cover ${isEarned ? '' : 'opacity-55 grayscale brightness-50'}`}
                                />
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />

                                {/* Tier pill bottom-left of hero */}
                                <span className={`absolute bottom-4 left-4 inline-flex items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-widest shadow-md ring-1 ${tier.pill}`}>
                                    {tier.label}
                                </span>
                                {isEarned && (
                                    <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-full bg-gaming-green px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-white shadow-md ring-1 ring-white/20">
                                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        Unlocked
                                    </span>
                                )}
                            </div>

                            {/* Body */}
                            <div className="space-y-4 p-6">
                                <div>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-3xl">{getAchievementIcon(selected.icon)}</span>
                                        <h3 id="achievement-modal-title" className="text-2xl font-extrabold text-white">
                                            {selected.name}
                                        </h3>
                                    </div>
                                    <p className="mt-2 text-sm leading-relaxed text-white/80">
                                        {selected.description}
                                    </p>
                                </div>

                                {/* Status row */}
                                <div className="flex flex-wrap items-center gap-3 border-y border-white/5 py-3 text-xs">
                                    <span className={`rounded-full px-2.5 py-0.5 font-extrabold ${tier.accent}`}>
                                        +{selected.points} XP
                                    </span>
                                    {isEarned && earnedDate ? (
                                        <span className="text-white/70">
                                            Unlocked on <strong className="text-white">{new Date(earnedDate).toLocaleDateString()}</strong>
                                        </span>
                                    ) : prog ? (
                                        <span className="text-white/70">
                                            <strong className="text-white">{Math.min(prog.current, prog.target)}</strong>{' '}/{' '}
                                            <strong className="text-white">{prog.target}</strong>{' '}{prog.label}
                                        </span>
                                    ) : (
                                        <span className="text-white/70">Locked</span>
                                    )}
                                </div>

                                {/* Progress bar (locked + has progress) */}
                                {!isEarned && prog && (
                                    <div>
                                        <div className="mb-1.5 flex items-center justify-between text-xs text-white/70">
                                            <span>Progress</span>
                                            <span className="font-bold text-white">{Math.round(progPercent)}%</span>
                                        </div>
                                        <div className="h-2.5 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/10">
                                            <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${progPercent}%` }} />
                                        </div>
                                    </div>
                                )}

                                {/* Locked teaser (no progress data — usually
                                    achievements that are auto-checked once a
                                    condition flips, like Living Legend). */}
                                {!isEarned && !prog && (
                                    <div className="rounded-xl bg-white/5 p-4 text-xs text-white/70 ring-1 ring-white/10">
                                        Keep playing — this one unlocks automatically when you meet the conditions in the description.
                                    </div>
                                )}

                                {isEarned && (
                                    <div className={`rounded-xl bg-gradient-to-r p-4 text-sm font-bold text-white ring-1 ring-white/10 ${
                                        tier.label === 'PLATINUM' ? 'from-fuchsia-500/20 to-amber-400/20'
                                        : tier.label === 'GOLD' ? 'from-yellow-500/20 to-amber-400/10'
                                        : tier.label === 'SILVER' ? 'from-slate-400/20 to-slate-300/10'
                                        : 'from-amber-700/20 to-amber-500/10'
                                    }`}>
                                        Earned. Wear it.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AuthenticatedLayout>
    );
}
