import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function CommunityCreate({ games }: { games: Game[] }) {
    const { data, setData, post, processing, errors } = useForm({
        title: '',
        body: '',
        game_id: '',
        type: 'discussion',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('community.store'));
    };

    const inputClass =
        'w-full rounded-lg border border-white/10 bg-navy-900 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gaming-purple focus:outline-none focus:ring-1 focus:ring-gaming-purple';
    const labelClass = 'mb-1.5 block text-sm font-medium text-gray-300';
    const errorClass = 'mt-1 text-xs text-red-400';

    const postTypes = [
        { value: 'discussion', label: 'Discussion' },
        { value: 'question', label: 'Question' },
        { value: 'tip', label: 'Tip / Guide' },
        { value: 'team', label: 'Team Recruitment' },
        { value: 'news', label: 'News' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Create Post" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href={route('community.index')}
                            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-white"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back to Community
                        </Link>
                        <h1 className="text-2xl font-bold text-white">Create Post</h1>
                        <p className="mt-1 text-sm text-gray-400">Share something with the community.</p>
                    </div>

                    <form onSubmit={submit} className="space-y-5 rounded-xl border border-white/10 bg-navy-800 p-6">
                        {/* Title */}
                        <div>
                            <label className={labelClass}>Title</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="What's on your mind?"
                                className={inputClass}
                                maxLength={255}
                            />
                            {errors.title && <p className={errorClass}>{errors.title}</p>}
                        </div>

                        {/* Type */}
                        <div>
                            <label className={labelClass}>Post Type</label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value)}
                                className={inputClass}
                            >
                                {postTypes.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            {errors.type && <p className={errorClass}>{errors.type}</p>}
                        </div>

                        {/* Game (optional) */}
                        <div>
                            <label className={labelClass}>Game (optional)</label>
                            <select
                                value={data.game_id}
                                onChange={(e) => setData('game_id', e.target.value)}
                                className={inputClass}
                            >
                                <option value="">No specific game</option>
                                {games.map((game) => (
                                    <option key={game.id} value={game.id}>{game.name}</option>
                                ))}
                            </select>
                            {errors.game_id && <p className={errorClass}>{errors.game_id}</p>}
                        </div>

                        {/* Body */}
                        <div>
                            <label className={labelClass}>Body</label>
                            <textarea
                                value={data.body}
                                onChange={(e) => setData('body', e.target.value)}
                                placeholder="Share your thoughts, tips, or questions..."
                                className={inputClass + ' min-h-[160px] resize-y'}
                                maxLength={10000}
                            />
                            <p className="mt-1 text-[10px] text-gray-500">{data.body.length}/10000 characters</p>
                            {errors.body && <p className={errorClass}>{errors.body}</p>}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full rounded-xl bg-gaming-purple px-6 py-3 text-sm font-semibold text-white transition hover:bg-gaming-purple/80 disabled:opacity-50"
                        >
                            {processing ? 'Posting...' : 'Post to Community'}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
