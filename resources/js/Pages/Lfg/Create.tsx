import GamePicker from '@/Components/GamePicker';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useState } from 'react';

export default function LfgCreate({ games }: { games: Game[] }) {
    const { data, setData, post, processing, errors } = useForm({
        game_id: '',
        title: '',
        description: '',
        spots_needed: 2,
        platform: '',
        rank_min: '',
        mic_required: false,
        language: '',
        age_requirement: 'None',
        requirements_note: '',
        discord_url: '',
        scheduled_at: '',
    });

    const [selectedGame, setSelectedGame] = useState<Game | null>(null);

    // Pre-select game from URL params (e.g., /lfg/create?game_id=5)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const gameId = params.get('game_id');
        if (gameId && !data.game_id) {
            handleGameChange(gameId);
        }
    }, []);

    const handleGameChange = (gameId: number | string | null) => {
        const idStr = gameId ? String(gameId) : '';
        setData('game_id', idStr);
        const game = gameId ? games.find((g) => g.id === Number(gameId)) || null : null;
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
        'w-full rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red';
    const labelClass = 'mb-1.5 block text-sm font-medium text-ink-700';
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
                            className="mb-2 inline-flex items-center gap-1 text-sm text-ink-500 transition hover:text-ink-900"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back to LFG
                        </Link>
                        <h1 className="text-2xl font-bold text-ink-900">Create LFG Post</h1>
                        <p className="mt-1 text-sm text-ink-500">Find teammates for your next gaming session.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5 rounded-xl border border-ink-900/10 bg-white p-6">
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
                            <GamePicker
                                games={games}
                                value={data.game_id || null}
                                onChange={handleGameChange}
                                placeholder="Search and select a game…"
                            />
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

                        {/* Group size (total, including host) */}
                        <div>
                            <label className={labelClass}>
                                Group size <span className="font-normal text-ink-500">— incl. yourself</span>
                            </label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={2}
                                    max={9}
                                    value={data.spots_needed}
                                    onChange={(e) => setData('spots_needed', Number(e.target.value))}
                                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-ink-900/10 accent-neon-red"
                                />
                                <span className="w-8 text-center text-lg font-bold text-neon-red">
                                    {data.spots_needed}
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-ink-500">
                                You + {data.spots_needed - 1} teammate{data.spots_needed - 1 === 1 ? '' : 's'} to find.
                            </p>
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

                        {/* Mic Required */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="mic_required"
                                checked={data.mic_required}
                                onChange={(e) => setData('mic_required', e.target.checked)}
                                className="h-4 w-4 rounded border-ink-900/10 bg-bone-50 text-neon-red focus:ring-neon-red"
                            />
                            <label htmlFor="mic_required" className="text-sm font-medium text-ink-700">
                                Mic Required
                            </label>
                        </div>

                        {/* Language */}
                        <div>
                            <label className={labelClass}>Language (optional)</label>
                            <input
                                type="text"
                                value={data.language}
                                onChange={(e) => setData('language', e.target.value)}
                                placeholder="e.g., English, Tagalog"
                                className={inputClass}
                                maxLength={50}
                            />
                            {errors.language && <p className={errorClass}>{errors.language}</p>}
                        </div>

                        {/* Age Requirement */}
                        <div>
                            <label className={labelClass}>Age Requirement</label>
                            <select
                                value={data.age_requirement}
                                onChange={(e) => setData('age_requirement', e.target.value)}
                                className={inputClass}
                            >
                                <option value="None">None</option>
                                <option value="16+">16+</option>
                                <option value="18+">18+</option>
                                <option value="21+">21+</option>
                            </select>
                            {errors.age_requirement && <p className={errorClass}>{errors.age_requirement}</p>}
                        </div>

                        {/* Requirements Note */}
                        <div>
                            <label className={labelClass}>Requirements Note (optional)</label>
                            <textarea
                                value={data.requirements_note}
                                onChange={(e) => setData('requirements_note', e.target.value)}
                                placeholder="Any custom requirements for your group..."
                                className={inputClass + ' min-h-[60px] resize-y'}
                                maxLength={500}
                            />
                            {errors.requirements_note && <p className={errorClass}>{errors.requirements_note}</p>}
                        </div>

                        {/* Discord */}
                        <div>
                            <label className={labelClass}>Discord Server (optional)</label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5865F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.791 19.791 0 00-4.885-1.5152.0729.0729 0 00-.0785.0378c-.2107.3748-.4443.8632-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1641-.3933-.4058-.8747-.6177-1.2495a.077.077 0 00-.0785-.0378 19.736 19.736 0 00-4.8852 1.5152.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.299 12.299 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" /></svg>
                                <input
                                    type="text"
                                    value={data.discord_url}
                                    onChange={(e) => setData('discord_url', e.target.value)}
                                    placeholder="https://discord.gg/your-server"
                                    className={inputClass + ' pl-9'}
                                    maxLength={255}
                                />
                            </div>
                            <p className="mt-1 text-[10px] text-gray-500">Share your Discord server so teammates can join voice chat</p>
                        </div>

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
                            className="w-full rounded-xl bg-neon-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-neon-red/80 disabled:opacity-50"
                        >
                            {processing ? 'Posting...' : 'Post LFG'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
