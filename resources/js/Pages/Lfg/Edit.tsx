import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

interface LfgPost {
    id: number;
    game_id: number;
    title: string;
    slug: string;
    description?: string;
    spots_needed: number;
    platform: string;
    rank_min?: string;
    mic_required: boolean;
    language?: string;
    age_requirement?: string;
    requirements_note?: string;
    scheduled_at?: string;
    game?: Game;
}

export default function LfgEdit({ post, games }: { post: LfgPost; games: Game[] }) {
    const { data, setData, processing, errors } = useForm({
        title: post.title,
        description: post.description || '',
        spots_needed: post.spots_needed,
        platform: post.platform,
        rank_min: post.rank_min || '',
        mic_required: post.mic_required || false,
        language: post.language || '',
        age_requirement: post.age_requirement || 'None',
        requirements_note: post.requirements_note || '',
        scheduled_at: post.scheduled_at ? post.scheduled_at.slice(0, 16) : '',
    });

    const selectedGame = games.find((g) => g.id === post.game_id) || null;

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        router.put(route('lfg.update', { lfgPost: post.slug }), data);
    };

    const inputClass = 'w-full rounded-lg border border-white/10 bg-navy-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple';
    const labelClass = 'mb-1.5 block text-sm font-medium text-gray-300';
    const allPlatforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];

    return (
        <AuthenticatedLayout>
            <Head title="Edit LFG Post" />
            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('lfg.show', { lfgPost: post.slug })} className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                            Back to Group
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Edit LFG Post</h1>
                    </div>

                    {selectedGame?.cover_image && (
                        <div className="mb-4 h-20 overflow-hidden rounded-lg">
                            <img src={selectedGame.cover_image} alt={selectedGame.name} className="h-full w-full object-cover" />
                        </div>
                    )}
                    <p className="mb-4 text-sm text-gray-400">Game: <strong className="text-white">{selectedGame?.name || 'Unknown'}</strong> (cannot be changed)</p>

                    <form onSubmit={submit} className="space-y-5 rounded-xl border border-white/10 bg-navy-800 p-6">
                        <div>
                            <label className={labelClass}>Title</label>
                            <input type="text" value={data.title} onChange={(e) => setData('title', e.target.value)} className={inputClass} maxLength={255} />
                        </div>
                        <div>
                            <label className={labelClass}>Description</label>
                            <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} className={inputClass + ' min-h-[80px] resize-y'} maxLength={1000} />
                        </div>
                        <div>
                            <label className={labelClass}>Spots Needed</label>
                            <div className="flex items-center gap-3">
                                <input type="range" min={1} max={9} value={data.spots_needed} onChange={(e) => setData('spots_needed', Number(e.target.value))} className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-white/10 accent-gaming-purple" />
                                <span className="w-8 text-center text-lg font-bold text-gaming-purple">{data.spots_needed}</span>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Platform</label>
                            <select value={data.platform} onChange={(e) => setData('platform', e.target.value)} className={inputClass}>
                                <option value="">Select platform</option>
                                {(selectedGame?.platforms?.length ? selectedGame.platforms : allPlatforms).map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        {selectedGame?.rank_system && selectedGame.rank_system.length > 0 && (
                            <div>
                                <label className={labelClass}>Minimum Rank</label>
                                <select value={data.rank_min} onChange={(e) => setData('rank_min', e.target.value)} className={inputClass}>
                                    <option value="">No minimum</option>
                                    {selectedGame.rank_system.map((rank) => <option key={rank} value={rank}>{rank}</option>)}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="mic" checked={data.mic_required} onChange={(e) => setData('mic_required', e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-navy-900 text-gaming-purple focus:ring-gaming-purple" />
                            <label htmlFor="mic" className="text-sm font-medium text-gray-300">Mic Required</label>
                        </div>
                        <div>
                            <label className={labelClass}>Language</label>
                            <input type="text" value={data.language} onChange={(e) => setData('language', e.target.value)} placeholder="e.g., English" className={inputClass} maxLength={50} />
                        </div>
                        <div>
                            <label className={labelClass}>Age Requirement</label>
                            <select value={data.age_requirement} onChange={(e) => setData('age_requirement', e.target.value)} className={inputClass}>
                                <option value="None">None</option>
                                <option value="16+">16+</option>
                                <option value="18+">18+</option>
                                <option value="21+">21+</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Requirements Note</label>
                            <textarea value={data.requirements_note} onChange={(e) => setData('requirements_note', e.target.value)} className={inputClass + ' min-h-[60px] resize-y'} maxLength={500} />
                        </div>
                        <div>
                            <label className={labelClass}>Scheduled Time</label>
                            <input type="datetime-local" value={data.scheduled_at} onChange={(e) => setData('scheduled_at', e.target.value)} className={inputClass} />
                        </div>
                        <button type="submit" disabled={processing} className="w-full rounded-xl bg-gaming-purple px-6 py-3 text-sm font-semibold text-white transition hover:bg-gaming-purple/80 disabled:opacity-50">
                            {processing ? 'Saving...' : 'Update LFG Post'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
