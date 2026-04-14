import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Achievement, PageProps } from '@/types';
import { Head } from '@inertiajs/react';

const iconMap: Record<string, string> = {
    heart: '\u2764\uFE0F', users: '\uD83D\uDC65', flag: '\uD83D\uDEA9',
    shield: '\uD83D\uDEE1\uFE0F', video: '\uD83C\uDFA5', gamepad: '\uD83C\uDFAE',
    chat: '\uD83D\uDCAC', star: '\u2B50', trophy: '\uD83C\uDFC6',
    megaphone: '\uD83D\uDCE3', fire: '\uD83D\uDD25', check: '\u2705',
};

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string; bar: string }> = {
    purple: { bg: 'bg-gaming-purple/10', border: 'border-gaming-purple/30', text: 'text-gaming-purple', glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]', bar: 'bg-gaming-purple' },
    green: { bg: 'bg-gaming-green/10', border: 'border-gaming-green/30', text: 'text-gaming-green', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]', bar: 'bg-gaming-green' },
    cyan: { bg: 'bg-gaming-cyan/10', border: 'border-gaming-cyan/30', text: 'text-gaming-cyan', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]', bar: 'bg-gaming-cyan' },
    pink: { bg: 'bg-gaming-pink/10', border: 'border-gaming-pink/30', text: 'text-gaming-pink', glow: 'shadow-[0_0_15px_rgba(244,114,182,0.3)]', bar: 'bg-gaming-pink' },
    orange: { bg: 'bg-gaming-orange/10', border: 'border-gaming-orange/30', text: 'text-gaming-orange', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]', bar: 'bg-yellow-500' },
};

const levelColors = ['text-gray-400', 'text-gaming-green', 'text-gaming-cyan', 'text-gaming-purple', 'text-gaming-pink', 'text-yellow-400'];

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

export default function Index({
    achievements,
    earnedIds,
    earnedDates,
    totalPoints,
    earnedPoints,
    progress,
    userXp,
    currentLevel,
    nextLevel,
    levels,
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
}>) {
    const earnedCount = earnedIds.length;
    const totalCount = achievements.length;

    const xpInLevel = nextLevel ? userXp - currentLevel.xp : 0;
    const xpNeeded = nextLevel ? nextLevel.xp - currentLevel.xp : 1;
    const levelProgress = nextLevel ? Math.min((xpInLevel / xpNeeded) * 100, 100) : 100;

    return (
        <AuthenticatedLayout>
            <Head title="Achievements" />

            {/* Hero */}
            <div className="relative h-32 overflow-hidden sm:h-40">
                <img src="/images/gamer8.jpg" alt="" className="h-full w-full object-cover opacity-25" />
                <div className="absolute inset-0 bg-gradient-to-b from-navy-900/30 via-navy-900/60 to-navy-900" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">Achievements</h1>
                        <p className="mt-1 text-sm text-gray-400">{earnedCount}/{totalCount} unlocked</p>
                    </div>
                </div>
            </div>

            <div className="py-8">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

                    {/* XP Level Card */}
                    <div className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-navy-800">
                        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                            {/* Level badge */}
                            <div className="flex items-center gap-4">
                                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-navy-700 text-3xl font-black ${levelColors[currentLevel.level - 1] || 'text-white'}`}>
                                    {currentLevel.level}
                                </div>
                                <div>
                                    <p className={`text-lg font-bold ${levelColors[currentLevel.level - 1] || 'text-white'}`}>{currentLevel.name}</p>
                                    <p className="text-sm text-gray-400">{userXp.toLocaleString()} XP earned</p>
                                </div>
                            </div>

                            {/* XP Progress */}
                            <div className="flex-1">
                                {nextLevel ? (
                                    <>
                                        <div className="mb-1.5 flex items-center justify-between text-xs">
                                            <span className="text-gray-400">Level {currentLevel.level}</span>
                                            <span className="font-semibold text-gray-300">{xpInLevel}/{xpNeeded} XP to Level {nextLevel.level}</span>
                                            <span className="text-gray-400">{nextLevel.name}</span>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-navy-700">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-gaming-purple via-gaming-cyan to-gaming-green transition-all duration-700"
                                                style={{ width: `${levelProgress}%` }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="rounded-lg bg-yellow-400/10 px-4 py-2 text-center text-sm font-semibold text-yellow-400">
                                        Max Level Reached!
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Level roadmap */}
                        <div className="flex border-t border-white/5">
                            {(levels || []).map((lvl: XpLevel) => (
                                <div key={lvl.level} className={`flex-1 py-2.5 text-center text-[10px] ${userXp >= lvl.xp ? levelColors[lvl.level - 1] + ' font-bold' : 'text-gray-600'}`}>
                                    <p>{lvl.name}</p>
                                    <p>{lvl.xp.toLocaleString()} XP</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* XP Sources info */}
                    <div className="mb-6 rounded-xl border border-white/10 bg-navy-800 p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">How to earn XP</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                                { action: 'Daily login', xp: '+5' },
                                { action: 'Send message', xp: '+1 (max 10/day)' },
                                { action: 'Host LFG', xp: '+20' },
                                { action: 'Join LFG', xp: '+10' },
                                { action: 'Give rating', xp: '+5' },
                                { action: '5-star received', xp: '+15' },
                                { action: 'New friend', xp: '+10' },
                                { action: 'Share clip', xp: '+5' },
                            ].map((item) => (
                                <div key={item.action} className="rounded-lg bg-navy-900 px-3 py-2">
                                    <p className="text-[11px] font-medium text-white">{item.action}</p>
                                    <p className="text-[10px] text-gaming-green">{item.xp}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Achievement Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {achievements.map((achievement) => {
                            const isEarned = earnedIds.includes(achievement.id);
                            const colors = colorClasses[achievement.color] || colorClasses.purple;
                            const earnedDate = earnedDates[achievement.id];
                            const prog = progress[achievement.slug];
                            const progPercent = prog ? Math.min((prog.current / prog.target) * 100, 100) : 0;

                            return (
                                <div
                                    key={achievement.id}
                                    className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
                                        isEarned
                                            ? `${colors.bg} ${colors.border} ${colors.glow}`
                                            : 'border-white/5 bg-navy-800/50'
                                    }`}
                                >
                                    {/* Earned badge */}
                                    {isEarned && (
                                        <div className="absolute right-3 top-3">
                                            <svg className={`h-5 w-5 ${colors.text}`} fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    )}
                                    {/* Lock for unearned */}
                                    {!isEarned && (
                                        <div className="absolute right-3 top-3 text-gray-600">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                            </svg>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${isEarned ? colors.bg : 'bg-navy-700'}`}>
                                            {iconMap[achievement.icon] || '\uD83C\uDFC6'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className={`font-bold ${isEarned ? colors.text : 'text-gray-400'}`}>
                                                {achievement.name}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-gray-500">{achievement.description}</p>

                                            {/* Progress bar for locked achievements */}
                                            {!isEarned && prog && (
                                                <div className="mt-2">
                                                    <div className="mb-1 flex items-center justify-between text-[10px]">
                                                        <span className="text-gray-500">{Math.min(prog.current, prog.target)}/{prog.target} {prog.label}</span>
                                                        <span className="text-gray-600">{Math.round(progPercent)}%</span>
                                                    </div>
                                                    <div className="h-1.5 overflow-hidden rounded-full bg-navy-700">
                                                        <div className={`h-full rounded-full ${colors.bar} transition-all`} style={{ width: `${progPercent}%` }} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="mt-2 flex items-center justify-between">
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isEarned ? `${colors.bg} ${colors.text}` : 'bg-navy-700 text-gray-600'}`}>
                                                    +{achievement.points} XP
                                                </span>
                                                {isEarned && earnedDate && (
                                                    <span className="text-[10px] text-gray-500">{new Date(earnedDate).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
