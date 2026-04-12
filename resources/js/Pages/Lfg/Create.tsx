import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function LfgCreate({ games }: { games: Game[] }) {
    const { data, setData, post, processing, errors } = useForm({
        game_id: '',
        title: '',
        description: '',
        spots_needed: 2,
        platform: '',
        rank_min: '',
        scheduled_at: '',
    });

    const [selectedGame, setSelectedGame] = useState<Game | null>(null);

    const handleGameChange = (gameId: string) => {
        setData('game_id', gameId);
        const game = games.find((g) => g.id === Number(gameId)) || null;
        setSelectedGame(game);
        setData('rank_min', '');
        if (game && game.platforms && game.platforms.length === 1) {
            setData('platform', game.platforms[0]);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('lfg.store'));
    };

    const inputClass =
        'w-full rounded-lg border border-white/10 bg-navy-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple';
    const labelClass = 'mb-1.5 block text-sm font-medium text-gray-300';
    const errorClass = 'mt-1 text-xs text-red-400';

    const allPlatforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];

    return (
        <AuthenticatedLayout>
            <Head title="Create LFG Post" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href={route('lfg.index')}
                            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back to LFG
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Create LFG Post</h1>
                        <p className="mt-1 text-sm text-gray-400">Find teammates for your next gaming session.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5 rounded-xl border border-white/10 bg-navy-800 p-6">
                        {/* Game Select */}
                        <div>
                            <label className={labelClass}>Game</label>
                            {selectedGame && selectedGame.cover_image && (
                                <div className="mb-2 h-20 overflow-hidden rounded-lg">
                                    <img
                                        src={selectedGame.cover_image || `/images/games/${selectedGame.slug}.svg`}
                                        alt={selectedGame.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                            <select
                                value={data.game_id}
                                onChange={(e) => handleGameChange(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select a game</option>
                                {games.map((game) => (
                                    <option key={game.id} value={game.id}>
                                        {game.name}
                                    </option>
                                ))}
                            </select>
                            {errors.game_id && <p className={errorClass}>{errors.game_id}</p>}
                        </div>

                        {/* Title */}
                        <div>
                            <label className={labelClass}>Title</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="e.g., Need 2 for ranked grind"
                                className={inputClass}
                                maxLength={255}
                            />
                            {errors.title && <p className={errorClass}>{errors.title}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label className={labelClass}>Description (optional)</label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Tell potential teammates what you're looking for..."
                                className={inputClass + ' min-h-[80px] resize-y'}
                                maxLength={1000}
                            />
                            {errors.description && <p className={errorClass}>{errors.description}</p>}
                        </div>

                        {/* Spots Needed */}
                        <div>
                            <label className={labelClass}>Spots Needed</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={1}
                                    max={9}
                                    value={data.spots_needed}
                                    onChange={(e) => setData('spots_needed', Number(e.target.value))}
                                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-gaming-purple"
                                />
                                <span className="w-8 text-center text-lg font-bold text-gaming-purple">
                                    {data.spots_needed}
                                </span>
                            </div>
                            {errors.spots_needed && <p className={errorClass}>{errors.spots_needed}</p>}
                        </div>

                        {/* Platform */}
                        <div>
                            <label className={labelClass}>Platform</label>
                            <select
                                value={data.platform}
                                onChange={(e) => setData('platform', e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Select platform</option>
                                {(selectedGame?.platforms && selectedGame.platforms.length > 0
                                    ? selectedGame.platforms
                                    : allPlatforms
                                ).map((p) => (
                                    <option key={p} value={p}>
                                        {p}
                                    </option>
                                ))}
                            </select>
                            {errors.platform && <p className={errorClass}>{errors.platform}</p>}
                        </div>

                        {/* Rank Min */}
                        {selectedGame?.rank_system && selectedGame.rank_system.length > 0 && (
                            <div>
                                <label className={labelClass}>Minimum Rank (optional)</label>
                                <select
                                    value={data.rank_min}
                                    onChange={(e) => setData('rank_min', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">No minimum</option>
                                    {selectedGame.rank_system.map((rank) => (
                                        <option key={rank} value={rank}>
                                            {rank}
                                        </option>
                                    ))}
                                </select>
                                {errors.rank_min && <p className={errorClass}>{errors.rank_min}</p>}
                            </div>
                        )}

                        {/* Scheduled At */}
                        <div>
                            <label className={labelClass}>Scheduled Time (optional)</label>
                            <input
                                type="datetime-local"
                                value={data.scheduled_at}
                                onChange={(e) => setData('scheduled_at', e.target.value)}
                                className={inputClass}
                            />
                            {errors.scheduled_at && <p className={errorClass}>{errors.scheduled_at}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-gaming-purple px-6 py-3 text-sm font-semibold text-white transition hover:bg-gaming-purple/80 disabled:opacity-50"
                        >
                            {processing ? 'Posting...' : 'Post LFG'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
