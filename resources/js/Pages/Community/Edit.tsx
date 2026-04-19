import GamePicker from '@/Components/GamePicker';
import MarkdownEditor from '@/Components/MarkdownEditor';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

interface Post {
    id: number;
    slug: string;
    title: string;
    body: string;
    game_id: number | null;
    type: 'discussion' | 'question' | 'tip' | 'team' | 'news';
}

export default function CommunityEdit({ post, games }: { post: Post; games: Game[] }) {
    const { data, setData, put, processing, errors } = useForm({
        title: post.title,
        body: post.body,
        game_id: post.game_id ? String(post.game_id) : '',
        type: post.type,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('community.update', post.slug));
    };

    const destroy = () => {
        if (!window.confirm("Delete this post? This removes all comments and votes as well — it can't be undone.")) return;
        router.delete(route('community.destroy', post.slug));
    };

    const inputClass =
        'w-full rounded-lg border border-ink-900/10 bg-bone-50 px-4 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red focus:outline-none focus:ring-1 focus:ring-neon-red';
    const labelClass = 'mb-1.5 block text-sm font-medium text-ink-700';
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
            <Head title="Edit Post" />

            <div className="py-6">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link
                            href={route('community.show', post.slug)}
                            className="mb-2 inline-flex items-center gap-1 text-sm text-ink-500 transition hover:text-ink-900"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                            </svg>
                            Back to post
                        </Link>
                        <h1 className="text-2xl font-bold text-ink-900">Edit Post</h1>
                    </div>

                    <form onSubmit={submit} className="space-y-5 rounded-xl border border-ink-900/10 bg-white p-6">
                        <div>
                            <label className={labelClass}>Title</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className={inputClass}
                                maxLength={255}
                            />
                            {errors.title && <p className={errorClass}>{errors.title}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Post Type</label>
                            <select
                                value={data.type}
                                onChange={(e) => setData('type', e.target.value as Post['type'])}
                                className={inputClass}
                            >
                                {postTypes.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                            {errors.type && <p className={errorClass}>{errors.type}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Game (optional)</label>
                            <GamePicker
                                games={games}
                                value={data.game_id || null}
                                onChange={(id) => setData('game_id', id ? String(id) : '')}
                                placeholder="No specific game"
                                allowClear
                                allLabel="No specific game"
                            />
                            {errors.game_id && <p className={errorClass}>{errors.game_id}</p>}
                        </div>

                        <div>
                            <label className={labelClass}>Body</label>
                            <MarkdownEditor
                                value={data.body}
                                onChange={(v) => setData('body', v)}
                                rows={10}
                                maxLength={10000}
                            />
                            {errors.body && <p className={errorClass}>{errors.body}</p>}
                        </div>

                        <div className="flex flex-col gap-2 border-t border-ink-900/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                            <button
                                type="button"
                                onClick={destroy}
                                className="rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-500 hover:text-white"
                            >
                                Delete post
                            </button>
                            <div className="flex gap-2">
                                <Link
                                    href={route('community.show', post.slug)}
                                    className="rounded-lg border border-ink-900/10 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-bone-100"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-neon-red px-6 py-2 text-sm font-semibold text-white transition hover:bg-neon-red/80 disabled:opacity-50"
                                >
                                    {processing ? 'Saving…' : 'Save changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
