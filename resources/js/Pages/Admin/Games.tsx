import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { FormEvent } from 'react';

interface Game {
    id: number;
    name: string;
    slug: string;
    genre: string;
    platforms: string[];
    cover_image?: string;
    users_count: number;
}

interface Props {
    games: Game[];
}

const platformOptions = ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'];

export default function Games({ games }: Props) {
    const { data, setData, post, processing, reset, errors } = useForm({
        name: '',
        genre: '',
        platforms: [] as string[],
        cover_image: '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post(route('admin.storeGame'), {
            onSuccess: () => reset(),
        });
    }

    function togglePlatform(platform: string) {
        setData(
            'platforms',
            data.platforms.includes(platform)
                ? data.platforms.filter((p) => p !== platform)
                : [...data.platforms, platform],
        );
    }

    function handleDelete(gameId: number, gameName: string) {
        if (!confirm(`Are you sure you want to delete "${gameName}"? This cannot be undone.`)) {
            return;
        }
        axios.delete(route('admin.deleteGame', { game: gameId })).then(() => {
            router.reload();
        });
    }

    return (
        <AdminLayout>
            <Head title="Admin - Games" />

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-ink-900">Games</h1>
                <p className="mt-1 text-sm text-ink-500">Manage the game library</p>
            </div>

            {/* Add Game Form */}
            <div className="mb-8 rounded-xl border border-ink-900/10 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold text-ink-900">Add Game</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-ink-500">Name</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Game name"
                                className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red/50 focus:outline-none focus:ring-1 focus:ring-neon-red/50"
                                required
                            />
                            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-ink-500">Genre</label>
                            <input
                                type="text"
                                value={data.genre}
                                onChange={(e) => setData('genre', e.target.value)}
                                placeholder="e.g. FPS, MOBA, RPG"
                                className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red/50 focus:outline-none focus:ring-1 focus:ring-neon-red/50"
                                required
                            />
                            {errors.genre && <p className="mt-1 text-xs text-red-400">{errors.genre}</p>}
                        </div>
                        <div className="lg:col-span-2">
                            <label className="mb-1.5 block text-xs font-medium text-ink-500">Cover Image URL</label>
                            <input
                                type="text"
                                value={data.cover_image}
                                onChange={(e) => setData('cover_image', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2.5 text-sm text-ink-900 placeholder-gray-500 focus:border-neon-red/50 focus:outline-none focus:ring-1 focus:ring-neon-red/50"
                            />
                            {errors.cover_image && <p className="mt-1 text-xs text-red-400">{errors.cover_image}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-medium text-ink-500">Platforms</label>
                        <div className="flex flex-wrap gap-2">
                            {platformOptions.map((platform) => (
                                <button
                                    key={platform}
                                    type="button"
                                    onClick={() => togglePlatform(platform)}
                                    className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                                        data.platforms.includes(platform)
                                            ? 'border-neon-red/50 bg-neon-red/10 text-neon-red'
                                            : 'border-ink-900/10 text-ink-500 hover:border-ink-900/20 hover:text-ink-900'
                                    }`}
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                        {errors.platforms && <p className="mt-1 text-xs text-red-400">{errors.platforms}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-neon-red px-6 py-2.5 text-sm font-medium text-white transition hover:bg-neon-red/80 disabled:opacity-50"
                    >
                        {processing ? 'Adding...' : 'Add Game'}
                    </button>
                </form>
            </div>

            {/* Games Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {games.map((game) => (
                    <div
                        key={game.id}
                        className="group overflow-hidden rounded-xl border border-ink-900/10 bg-white transition hover:border-neon-red/30"
                    >
                        <div className="relative h-36 overflow-hidden bg-bone-50">
                            {game.cover_image ? (
                                <img
                                    src={game.cover_image}
                                    alt={game.name}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                            ) : (
                                <img
                                    src={`/images/games/${game.slug}.svg`}
                                    alt={game.name}
                                    className="h-full w-full object-cover transition group-hover:scale-105"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-bone-50/90 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="text-sm font-bold text-ink-900">{game.name}</h3>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="rounded-full bg-neon-red/10 px-2 py-0.5 text-xs font-medium text-neon-red">
                                    {game.genre}
                                </span>
                                <span className="text-xs text-gray-500">{game.users_count} players</span>
                            </div>

                            <div className="flex flex-wrap gap-1">
                                {game.platforms.map((platform) => (
                                    <span
                                        key={platform}
                                        className="rounded bg-ink-900/5 px-1.5 py-0.5 text-[10px] text-ink-500"
                                    >
                                        {platform}
                                    </span>
                                ))}
                            </div>

                            <button
                                onClick={() => handleDelete(game.id, game.name)}
                                className="w-full rounded-lg border border-red-500/20 bg-red-500/5 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
                            >
                                Delete Game
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {games.length === 0 && (
                <div className="rounded-xl border border-dashed border-ink-900/10 bg-bone-100/50 py-16 text-center">
                    <p className="text-gray-500">No games yet. Add one above.</p>
                </div>
            )}
        </AdminLayout>
    );
}
