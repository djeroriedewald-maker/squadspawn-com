import GamePicker from '@/Components/GamePicker';
import RichEditor from '@/Components/RichEditor';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Game } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ChangeEvent, FormEventHandler, useRef, useState } from 'react';

interface EventData {
    id: number;
    slug: string;
    type: string;
    title: string;
    body_html: string | null;
    cover_image: string | null;
    video_url: string | null;
    scheduled_for: string;
    ends_at: string | null;
    timezone: string;
    region: string | null;
    game_id: number | null;
    max_capacity: number | null;
    format: string;
    external_link: string | null;
    status: string;
}

const TYPE_OPTIONS = [
    { value: 'tournament', label: 'Tournament', hint: 'Bracket / single elimination / round robin' },
    { value: 'livestream', label: 'Watch party', hint: 'Watch a Major / esports event together' },
    { value: 'giveaway', label: 'Giveaway', hint: 'Drop, contest, in-game item or prize pool' },
    { value: 'meetup', label: 'Meetup', hint: 'Casual squad night, no stakes' },
    { value: 'training', label: 'Training', hint: 'Coaching session, scrim, drill night' },
    { value: 'other', label: 'Other', hint: 'Anything else' },
];

const REGIONS = [
    'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam',
    'Japan', 'South Korea', 'India', 'Netherlands', 'Germany', 'United Kingdom',
    'France', 'Spain', 'Italy', 'United States', 'Canada', 'Brazil', 'Mexico',
    'Australia', 'Global',
];

// `datetime-local` wants `YYYY-MM-DDTHH:MM` with no timezone suffix —
// trim the seconds + Z that Laravel's toJson() emits.
function toLocalInput(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventEdit({ event, games, types, formats }: {
    event: EventData;
    games: Game[];
    types: string[];
    formats: string[];
}) {
    const { data, setData, put, processing, errors } = useForm({
        type: event.type,
        title: event.title,
        body_html: event.body_html ?? '',
        cover_image: event.cover_image ?? '',
        video_url: event.video_url ?? '',
        scheduled_for: toLocalInput(event.scheduled_for),
        ends_at: toLocalInput(event.ends_at),
        timezone: event.timezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'),
        region: event.region ?? '',
        game_id: event.game_id ?? ('' as string | number | null),
        max_capacity: (event.max_capacity ?? '') as string | number,
        format: event.format,
        external_link: event.external_link ?? '',
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleCoverUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        try {
            const fd = new FormData();
            fd.append('cover', file);
            const { data: resp } = await axios.post(route('events.uploadCover'), fd);
            setData('cover_image', resp.url);
        } catch (err: any) {
            setUploadError(err?.response?.data?.errors?.cover?.[0] || 'Upload failed.');
        } finally {
            setUploading(false);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('events.update', event.slug));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Edit · ${event.title}`} />

            <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
                <Link
                    href={route('events.show', event.slug)}
                    className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 transition hover:text-neon-red"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to event
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-ink-900">Edit event</h1>
                {event.status === 'published' && (
                    <p className="mt-2 rounded-lg border border-gaming-orange/30 bg-gaming-orange/5 px-3 py-2 text-xs text-ink-700">
                        Heads up — saving will send this event back into the moderation queue.
                        It stays visible to you while it waits.
                    </p>
                )}

                <form onSubmit={submit} className="mt-8 space-y-6">
                    <fieldset>
                        <legend className="text-sm font-bold text-ink-900">What kind of event?</legend>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {TYPE_OPTIONS.filter((t) => types.includes(t.value)).map((t) => (
                                <label
                                    key={t.value}
                                    className={`cursor-pointer rounded-lg border p-3 text-sm transition ${
                                        data.type === t.value
                                            ? 'border-neon-red bg-neon-red/5 ring-1 ring-neon-red/20'
                                            : 'border-ink-900/10 bg-white hover:border-neon-red/30'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={t.value}
                                        checked={data.type === t.value}
                                        onChange={(e) => setData('type', e.target.value)}
                                        className="sr-only"
                                    />
                                    <span className="block font-bold text-ink-900">{t.label}</span>
                                    <span className="mt-0.5 block text-xs text-ink-500">{t.hint}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div>
                        <label htmlFor="title" className="block text-sm font-bold text-ink-900">Event title</label>
                        <input
                            id="title"
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            maxLength={100}
                            required
                            className="mt-1 block w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/40 focus:outline-none focus:ring-2 focus:ring-neon-red/20"
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-ink-900">Cover image</label>
                        <div className="mt-1 flex flex-wrap items-center gap-3">
                            {data.cover_image ? (
                                <img src={data.cover_image} alt="" className="h-20 w-36 rounded-lg border border-ink-900/10 object-cover" />
                            ) : (
                                <div className="flex h-20 w-36 items-center justify-center rounded-lg border border-dashed border-ink-900/15 bg-bone-100 text-xs text-ink-500">No cover</div>
                            )}
                            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCoverUpload} className="hidden" />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="rounded-lg border border-ink-900/15 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red disabled:opacity-50"
                            >
                                {uploading ? 'Uploading…' : data.cover_image ? 'Change image' : 'Upload image'}
                            </button>
                            {data.cover_image && (
                                <button type="button" onClick={() => setData('cover_image', '')} className="text-xs font-semibold text-ink-500 transition hover:text-red-500">
                                    Remove
                                </button>
                            )}
                        </div>
                        {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-ink-900">Description</label>
                        <div className="mt-2">
                            <RichEditor
                                value={data.body_html}
                                onChange={(html) => setData('body_html', html)}
                                placeholder="Format, prize pool, rules, how to join…"
                                error={errors.body_html}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="scheduled_for" className="block text-sm font-bold text-ink-900">Starts at</label>
                            <input
                                id="scheduled_for"
                                type="datetime-local"
                                value={data.scheduled_for}
                                onChange={(e) => setData('scheduled_for', e.target.value)}
                                required
                                className="mt-1 block w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/40 focus:outline-none focus:ring-2 focus:ring-neon-red/20"
                            />
                            {errors.scheduled_for && <p className="mt-1 text-xs text-red-500">{errors.scheduled_for}</p>}
                        </div>
                        <div>
                            <label htmlFor="ends_at" className="block text-sm font-bold text-ink-900">Ends at <span className="font-normal text-ink-500">(optional)</span></label>
                            <input
                                id="ends_at"
                                type="datetime-local"
                                value={data.ends_at}
                                onChange={(e) => setData('ends_at', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/40 focus:outline-none focus:ring-2 focus:ring-neon-red/20"
                            />
                            {errors.ends_at && <p className="mt-1 text-xs text-red-500">{errors.ends_at}</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="region" className="block text-sm font-bold text-ink-900">Region</label>
                            <select
                                id="region"
                                value={data.region}
                                onChange={(e) => setData('region', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/40 focus:outline-none focus:ring-2 focus:ring-neon-red/20"
                            >
                                <option value="">Any / Global</option>
                                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="game_id" className="block text-sm font-bold text-ink-900">Game <span className="font-normal text-ink-500">(optional)</span></label>
                            <div className="mt-1">
                                <GamePicker
                                    games={games}
                                    value={data.game_id}
                                    onChange={(id) => setData('game_id', id ?? '')}
                                    placeholder="Search games…"
                                    allowClear
                                    allLabel="Not game-specific"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="format" className="block text-sm font-bold text-ink-900">Format</label>
                            <select
                                id="format"
                                value={data.format}
                                onChange={(e) => setData('format', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/40 focus:outline-none focus:ring-2 focus:ring-neon-red/20"
                            >
                                {formats.map((f) => <option key={f} value={f}>{f === 'solo' ? 'Solo sign-up' : 'Team sign-up'}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="max_capacity" className="block text-sm font-bold text-ink-900">Max attendees <span className="font-normal text-ink-500">(blank = unlimited)</span></label>
                            <input
                                id="max_capacity"
                                type="number"
                                min={2}
                                max={10000}
                                value={data.max_capacity}
                                onChange={(e) => setData('max_capacity', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/40 focus:outline-none focus:ring-2 focus:ring-neon-red/20"
                            />
                            {errors.max_capacity && <p className="mt-1 text-xs text-red-500">{errors.max_capacity}</p>}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="external_link" className="block text-sm font-bold text-ink-900">External link <span className="font-normal text-ink-500">(Discord / sign-up)</span></label>
                            <input
                                id="external_link"
                                type="url"
                                value={data.external_link}
                                onChange={(e) => setData('external_link', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/40 focus:outline-none focus:ring-2 focus:ring-neon-red/20"
                            />
                            {errors.external_link && <p className="mt-1 text-xs text-red-500">{errors.external_link}</p>}
                        </div>
                        <div>
                            <label htmlFor="video_url" className="block text-sm font-bold text-ink-900">Stream / trailer URL</label>
                            <input
                                id="video_url"
                                type="url"
                                value={data.video_url}
                                onChange={(e) => setData('video_url', e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-ink-900/10 bg-bone-50 px-3 py-2 text-sm text-ink-900 focus:border-neon-red/40 focus:outline-none focus:ring-2 focus:ring-neon-red/20"
                            />
                            {errors.video_url && <p className="mt-1 text-xs text-red-500">{errors.video_url}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border-t border-ink-900/10 pt-6">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-neon-red px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-neon-red/30 transition hover:bg-neon-red/90 disabled:opacity-50"
                        >
                            {processing ? 'Saving…' : 'Save changes'}
                        </button>
                        <Link
                            href={route('events.show', event.slug)}
                            className="text-xs font-semibold text-ink-500 hover:text-neon-red"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
