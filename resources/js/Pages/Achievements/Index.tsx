import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Achievement, PageProps } from '@/types';
import { Head } from '@inertiajs/react';

const iconMap: Record<string, string> = {
    heart: '\u2764\uFE0F',
    users: '\uD83D\uDC65',
    flag: '\uD83D\uDEA9',
    shield: '\uD83D\uDEE1\uFE0F',
    video: '\uD83C\uDFA5',
    gamepad: '\uD83C\uDFAE',
    chat: '\uD83D\uDCAC',
    star: '\u2B50',
    trophy: '\uD83C\uDFC6',
    megaphone: '\uD83D\uDCE3',
    fire: '\uD83D\uDD25',
    check: '\u2705',
};

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    purple: {
        bg: 'bg-gaming-purple/10',
        border: 'border-gaming-purple/30',
        text: 'text-gaming-purple',
        glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    },
    green: {
        bg: 'bg-gaming-green/10',
        border: 'border-gaming-green/30',
        text: 'text-gaming-green',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    },
    cyan: {
        bg: 'bg-gaming-cyan/10',
        border: 'border-gaming-cyan/30',
        text: 'text-gaming-cyan',
        glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]',
    },
    pink: {
        bg: 'bg-gaming-pink/10',
        border: 'border-gaming-pink/30',
        text: 'text-gaming-pink',
        glow: 'shadow-[0_0_15px_rgba(244,114,182,0.3)]',
    },
    orange: {
        bg: 'bg-gaming-orange/10',
        border: 'border-gaming-orange/30',
        text: 'text-gaming-orange',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]',
    },
};

export default function Index({
    achievements,
    earnedIds,
    earnedDates,
    totalPoints,
    earnedPoints,
}: PageProps<{
    achievements: Achievement[];
    earnedIds: number[];
    earnedDates: Record<number, string>;
    totalPoints: number;
    earnedPoints: number;
}>) {
    const earnedCount = earnedIds.length;
    const totalCount = achievements.length;
    const progressPercent = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    return (
        <AuthenticatedLayout>
            <Head title="Achievements" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-white">
                            <span className="text-neon-purple">Achievements</span>
                        </h1>
                        <p className="mt-2 text-lg text-gray-400">
                            {earnedCount}/{totalCount} Achievements Unlocked
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="glow-border mx-auto mb-10 max-w-2xl rounded-2xl border border-white/5 bg-navy-800 p-6">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-300">Achievement Points</span>
                            <span className="text-sm font-bold text-gaming-purple">
                                {earnedPoints} / {totalPoints}
                            </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-navy-700">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-gaming-purple via-gaming-cyan to-gaming-green transition-all duration-700"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="mt-2 text-center text-xs text-gray-500">
                            {Math.round(progressPercent)}% Complete
                        </p>
                    </div>

                    {/* Achievement Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {achievements.map((achievement) => {
                            const isEarned = earnedIds.includes(achievement.id);
                            const colors = colorClasses[achievement.color] || colorClasses.purple;
                            const earnedDate = earnedDates[achievement.id];

                            return (
                                <div
                                    key={achievement.id}
                                    className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
                                        isEarned
                                            ? `${colors.bg} ${colors.border} ${colors.glow}`
                                            : 'border-white/5 bg-navy-800/50 opacity-50 grayscale'
                                    }`}
                                >
                                    {/* Lock overlay for unearned */}
                                    {!isEarned && (
                                        <div className="absolute right-3 top-3 text-gray-600">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={1.5}
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                                />
                                            </svg>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div
                                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${
                                                isEarned ? colors.bg : 'bg-navy-700'
                                            }`}
                                        >
                                            {iconMap[achievement.icon] || '\uD83C\uDFC6'}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className={`font-bold ${isEarned ? colors.text : 'text-gray-500'}`}>
                                                {achievement.name}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-gray-500">
                                                {achievement.description}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                                        isEarned
                                                            ? `${colors.bg} ${colors.text}`
                                                            : 'bg-navy-700 text-gray-600'
                                                    }`}
                                                >
                                                    +{achievement.points} pts
                                                </span>
                                                {isEarned && earnedDate && (
                                                    <span className="text-[10px] text-gray-500">
                                                        {new Date(earnedDate).toLocaleDateString()}
                                                    </span>
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
