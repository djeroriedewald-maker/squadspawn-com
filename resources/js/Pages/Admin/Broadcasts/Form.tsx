import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ChangeEvent, FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';

const RichEditor = lazy(() => import('@/Components/RichEditor'));

interface Broadcast {
    id: number;
    title: string;
    body?: string | null;
    body_html?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    youtube_url?: string | null;
    image_url?: string | null;
    target_filters?: { game_ids?: number[]; regions?: string[]; min_level?: number };
    scheduled_at?: string | null;
    sent_at?: string | null;
    push_enabled: boolean;
    style: 'popup' | 'banner';
}

interface Game { id: number; name: string; }

export default function BroadcastForm({
    broadcast,
    allGames,
    allRegions,
    totalUsers,
}: {
    broadcast: Broadcast | null;
    allGames: Game[];
    allRegions: string[];
    totalUsers: number;
}) {
    const isEditing = !!broadcast;
    const isSent = !!broadcast?.sent_at;

    const [audienceCount, setAudienceCount] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(broadcast?.image_url ?? null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [testSending, setTestSending] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

    const sendTest = async () => {
        if (!broadcast?.id) {
            setTestResult({
                ok: false,
                message: 'Save this broadcast as a draft first — the test needs a broadcast id to deliver against.',
            });
            return;
        }
        setTestSending(true);
        setTestResult(null);
        try {
            const res = await axios.post(route('admin.broadcasts.test', broadcast.id));
            setTestResult({ ok: true, message: res.data.message });
        } catch (err: any) {
            setTestResult({ ok: false, message: err?.response?.data?.message ?? 'Test failed.' });
        } finally {
            setTestSending(false);
        }
    };

    const { data, setData, processing, errors } = useForm<{
        title: string;
        body: string;
        cta_label: string;
        cta_url: string;
        youtube_url: string;
        style: 'popup' | 'banner';
        push_enabled: boolean;
        scheduled_at: string;
        target_filters: { game_ids: number[]; regions: string[]; min_level: number | null };
        send_now: boolean;
    }>({
        title: broadcast?.title ?? '',
        body: broadcast?.body ?? '',
        cta_label: broadcast?.cta_label ?? '',
        cta_url: broadcast?.cta_url ?? '',
        youtube_url: broadcast?.youtube_url ?? '',
        style: broadcast?.style ?? 'popup',
        push_enabled: broadcast?.push_enabled ?? true,
        scheduled_at: broadcast?.scheduled_at ?? '',
        target_filters: {
            game_ids: broadcast?.target_filters?.game_ids ?? [],
            regions: broadcast?.target_filters?.regions ?? [],
            min_level: broadcast?.target_filters?.min_level ?? null,
        },
        send_now: false,
    });

    // Debounced audience preview. Fires whenever the targeting changes so
    // the "Send to N users" number stays accurate.
    useEffect(() => {
        const t = setTimeout(() => {
            axios.post(route('admin.broadcasts.preview'), { target_filters: data.target_filters })
                .then((res) => setAudienceCount(res.data.count))
                .catch(() => setAudienceCount(null));
        }, 250);
        return () => clearTimeout(t);
    }, [JSON.stringify(data.target_filters)]);

    const onImage = (e: ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setImage(f);
        setImagePreview(URL.createObjectURL(f));
    };

    const submit = (e: FormEvent, sendNow: boolean) => {
        e.preventDefault();
        // Use a raw FormData so the image hitches along.
        const fd = new FormData();
        fd.append('title', data.title);
        fd.append('body', data.body);
        fd.append('cta_label', data.cta_label);
        fd.append('cta_url', data.cta_url);
        fd.append('youtube_url', data.youtube_url);
        fd.append('style', data.style);
        fd.append('push_enabled', data.push_enabled ? '1' : '0');
        if (data.scheduled_at) fd.append('scheduled_at', data.scheduled_at);
        if (image) fd.append('image', image);
        data.target_filters.game_ids.forEach((id) => fd.append('target_filters[game_ids][]', String(id)));
        data.target_filters.regions.forEach((r) => fd.append('target_filters[regions][]', r));
        if (data.target_filters.min_level) fd.append('target_filters[min_level]', String(data.target_filters.min_level));
        if (sendNow) fd.append('send_now', '1');

        // Laravel tunnels PUT through POST with _method when using
        // multipart/form-data — that's the only way to include the file.
        if (isEditing) {
            fd.append('_method', 'PUT');
            router.post(route('admin.broadcasts.update', broadcast!.id), fd, { forceFormData: true });
        } else {
            router.post(route('admin.broadcasts.store'), fd, { forceFormData: true });
        }
    };

    const toggleGame = (id: number) => {
        const current = data.target_filters.game_ids;
        const next = current.includes(id) ? current.filter((g) => g !== id) : [...current, id];
        setData('target_filters', { ...data.target_filters, game_ids: next });
    };

    const toggleRegion = (region: string) => {
        const current = data.target_filters.regions;
        const next = current.includes(region) ? current.filter((r) => r !== region) : [...current, region];
        setData('target_filters', { ...data.target_filters, regions: next });
    };

    const previewBody = useMemo(() => {
        // Show the current body HTML as-is inside the preview modal.
        // Sanitisation happens server-side on save; for the preview we
        // trust our own input.
        return data.body;
    }, [data.body]);

    const youtubeId = useMemo(() => {
        const m = data.youtube_url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
        return m?.[1] ?? null;
    }, [data.youtube_url]);

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Edit broadcast' : 'New broadcast'} />

            <div className="mb-6">
                <Link href={route('admin.broadcasts.index')} className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-neon-red">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to broadcasts
                </Link>
                <h1 className="text-2xl font-bold text-ink-900">{isEditing ? (isSent ? 'Broadcast (sent)' : 'Edit broadcast') : 'New broadcast'}</h1>
                {isSent && <p className="mt-1 text-xs text-ink-500">Already delivered. Editing is locked — clone it instead if you need a variant.</p>}
            </div>

            <form onSubmit={(e) => submit(e, false)} className="grid gap-6 lg:grid-cols-[1fr_340px]">
                {/* Left: content */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">
                            Title <span className="text-neon-red">*</span>
                        </label>
                        <input
                            type="text"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            disabled={isSent}
                            placeholder="e.g. Profile banners are here"
                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-4 py-2.5 text-lg font-semibold text-ink-900 outline-none transition focus:border-neon-red focus:ring-2 focus:ring-neon-red/20 disabled:opacity-60"
                        />
                        {errors.title && <p className="mt-1.5 text-xs text-red-500">{errors.title}</p>}
                        <p className="mt-1.5 text-[11px] text-ink-500">Required. Everything else is optional.</p>
                    </div>

                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-ink-500">Body</label>
                        <p className="mb-3 text-xs text-ink-500">Rich text, inline images, and YouTube embeds — same editor as community posts.</p>
                        <Suspense fallback={<div className="h-48 animate-pulse rounded-lg border border-ink-100 bg-bone-100" />}>
                            <RichEditor
                                value={data.body}
                                onChange={(html) => setData('body', html)}
                                placeholder="Short, punchy paragraphs work best. Anything longer goes under the CTA on /announcements."
                                error={errors.body}
                            />
                        </Suspense>
                    </div>

                    <div className="grid gap-4 rounded-2xl border border-ink-900/10 bg-white p-6 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">CTA label</label>
                            <input
                                type="text"
                                value={data.cta_label}
                                onChange={(e) => setData('cta_label', e.target.value)}
                                disabled={isSent}
                                placeholder="Try it out"
                                className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">CTA URL</label>
                            <input
                                type="url"
                                value={data.cta_url}
                                onChange={(e) => setData('cta_url', e.target.value)}
                                disabled={isSent}
                                placeholder="https://squadspawn.com/..."
                                className={`w-full rounded-lg border bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none transition focus:ring-2 ${
                                    data.cta_url && !data.cta_url.startsWith('https://')
                                        ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-ink-900/10 focus:border-neon-red focus:ring-neon-red/20'
                                }`}
                            />
                            {data.cta_url && !data.cta_url.startsWith('https://') && (
                                <p className="mt-1.5 text-xs text-red-500">Must start with <code>https://</code> — <code>http://</code> links are rejected for user safety.</p>
                            )}
                            {errors.cta_url && <p className="mt-1.5 text-xs text-red-500">{errors.cta_url}</p>}
                            <p className="mt-1 text-[10px] text-ink-500">Must be an https:// URL. Internal paths like <code>/lfg</code> aren't supported here — use a full URL.</p>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">YouTube URL (optional)</label>
                            <input
                                type="url"
                                value={data.youtube_url}
                                onChange={(e) => setData('youtube_url', e.target.value)}
                                disabled={isSent}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                            />
                            {youtubeId && (
                                <div className="mt-3 overflow-hidden rounded-lg border border-ink-900/10">
                                    <div className="relative aspect-video w-full bg-black">
                                        <iframe
                                            className="absolute inset-0 h-full w-full"
                                            src={`https://www.youtube.com/embed/${youtubeId}`}
                                            title="Preview"
                                            frameBorder={0}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                        />
                                    </div>
                                </div>
                            )}
                            {errors.youtube_url && <p className="mt-1.5 text-xs text-red-500">{errors.youtube_url}</p>}
                        </div>

                        <div className="sm:col-span-2">
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Hero image (optional — ignored when a YouTube URL is set)</label>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={isSent}
                                    className="rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-xs font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red disabled:opacity-60"
                                >
                                    {imagePreview ? 'Replace image' : 'Choose image'}
                                </button>
                                {imagePreview && (
                                    <img src={imagePreview} alt="Preview" className="h-14 w-24 rounded-lg object-cover" />
                                )}
                                <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} className="hidden" />
                            </div>
                            {(errors as Record<string, string>).image && <p className="mt-1.5 text-xs text-red-500">{(errors as Record<string, string>).image}</p>}
                        </div>
                    </div>
                </div>

                {/* Right: targeting + publish */}
                <aside className="space-y-6">
                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
                        <h3 className="mb-4 text-sm font-bold text-ink-900">Delivery</h3>

                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Style</label>
                        <div className="mb-5 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setData('style', 'popup')}
                                disabled={isSent}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    data.style === 'popup' ? 'border-neon-red/40 bg-neon-red/10 text-neon-red' : 'border-ink-900/10 bg-bone-100 text-ink-700'
                                }`}
                            >
                                Popup modal
                                <span className="mt-0.5 block text-[10px] font-normal opacity-70">Blocks the page once</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('style', 'banner')}
                                disabled={isSent}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                    data.style === 'banner' ? 'border-gaming-cyan/40 bg-gaming-cyan/10 text-gaming-cyan' : 'border-ink-900/10 bg-bone-100 text-ink-700'
                                }`}
                            >
                                Announcements only
                                <span className="mt-0.5 block text-[10px] font-normal opacity-70">No popup — lives on /announcements</span>
                            </button>
                        </div>

                        <label className="mb-2 flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                checked={data.push_enabled}
                                onChange={(e) => setData('push_enabled', e.target.checked)}
                                disabled={isSent}
                                className="mt-0.5 h-4 w-4 rounded border-ink-900/20 text-neon-red focus:ring-neon-red/30"
                            />
                            <span className="text-xs">
                                <span className="block font-semibold text-ink-900">Send push notification</span>
                                <span className="block text-ink-500">Respects each user's notification-preference for the "announcement" category.</span>
                            </span>
                        </label>

                        <label className="mb-1.5 mt-5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Schedule (optional)</label>
                        <input
                            type="datetime-local"
                            value={data.scheduled_at}
                            onChange={(e) => setData('scheduled_at', e.target.value)}
                            disabled={isSent}
                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                        />
                        <p className="mt-1 text-[10px] text-ink-500">Leave blank + click "Send now" to deliver immediately.</p>
                    </div>

                    <div className="rounded-2xl border border-ink-900/10 bg-white p-6">
                        <h3 className="mb-1 text-sm font-bold text-ink-900">Targeting</h3>
                        <p className="mb-4 text-xs text-ink-500">Leave blank to send to everyone ({totalUsers.toLocaleString()} users).</p>

                        <details className="mb-3 rounded-lg border border-ink-900/10 bg-bone-50">
                            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-ink-700">
                                Games ({data.target_filters.game_ids.length})
                            </summary>
                            <div className="max-h-56 overflow-y-auto p-3">
                                <div className="grid gap-1">
                                    {allGames.map((g) => (
                                        <label key={g.id} className="flex cursor-pointer items-center gap-2 text-xs">
                                            <input
                                                type="checkbox"
                                                checked={data.target_filters.game_ids.includes(g.id)}
                                                onChange={() => toggleGame(g.id)}
                                                disabled={isSent}
                                                className="h-3.5 w-3.5 rounded border-ink-900/20 text-neon-red focus:ring-neon-red/30"
                                            />
                                            <span className="text-ink-700">{g.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </details>

                        <details className="mb-3 rounded-lg border border-ink-900/10 bg-bone-50">
                            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-ink-700">
                                Regions ({data.target_filters.regions.length})
                            </summary>
                            <div className="max-h-56 overflow-y-auto p-3">
                                <div className="grid gap-1">
                                    {allRegions.map((r) => (
                                        <label key={r} className="flex cursor-pointer items-center gap-2 text-xs">
                                            <input
                                                type="checkbox"
                                                checked={data.target_filters.regions.includes(r)}
                                                onChange={() => toggleRegion(r)}
                                                disabled={isSent}
                                                className="h-3.5 w-3.5 rounded border-ink-900/20 text-neon-red focus:ring-neon-red/30"
                                            />
                                            <span className="text-ink-700">{r}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </details>

                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-500">Min level</label>
                        <select
                            value={data.target_filters.min_level ?? ''}
                            onChange={(e) => setData('target_filters', {
                                ...data.target_filters,
                                min_level: e.target.value ? parseInt(e.target.value) : null,
                            })}
                            disabled={isSent}
                            className="w-full rounded-lg border border-ink-900/10 bg-bone-100 px-3 py-2 text-sm text-ink-900 outline-none focus:border-neon-red focus:ring-2 focus:ring-neon-red/20"
                        >
                            <option value="">Any level</option>
                            {[2, 3, 4, 5, 6].map((l) => (
                                <option key={l} value={l}>Level {l}+</option>
                            ))}
                        </select>

                        <div className="mt-5 rounded-lg border border-neon-red/30 bg-neon-red/5 p-3 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">Audience</p>
                            <p className="text-2xl font-extrabold text-neon-red">
                                {audienceCount?.toLocaleString() ?? '…'}
                            </p>
                            <p className="text-[10px] text-ink-500">users match these filters</p>
                        </div>
                    </div>

                    {!isSent && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowPreview(true)}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-ink-900/10 bg-white px-4 py-3 text-sm font-semibold text-ink-700 transition hover:border-neon-red/30 hover:text-neon-red"
                            >
                                Preview as user
                            </button>
                            <button
                                type="submit"
                                disabled={processing || !data.title.trim()}
                                title={!data.title.trim() ? 'Give your broadcast a title first.' : undefined}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-bone-100 px-4 py-3 text-sm font-semibold text-ink-900 transition hover:bg-bone-200 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {processing ? 'Saving…' : 'Save as draft'}
                            </button>
                            {!isEditing && (
                                <div className="flex items-start gap-2 rounded-lg border border-gaming-orange/30 bg-gaming-orange/5 p-3 text-[11px] text-gaming-orange">
                                    <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                                    </svg>
                                    <span>
                                        Click <strong>Save as draft</strong> first. You'll land on the edit screen where <strong>"Send test to me"</strong> becomes clickable.
                                    </span>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={sendTest}
                                disabled={testSending || !isEditing}
                                title={!isEditing ? 'Save the draft first — this button needs a saved broadcast id.' : undefined}
                                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                    isEditing
                                        ? 'border-gaming-cyan/40 bg-gaming-cyan/10 text-gaming-cyan hover:bg-gaming-cyan/20'
                                        : 'cursor-not-allowed border-ink-900/10 bg-bone-100/50 text-ink-500'
                                } disabled:opacity-50`}
                            >
                                {testSending
                                    ? 'Sending…'
                                    : isEditing
                                        ? '🎯 Send test to me only'
                                        : '🎯 Send test to me (save draft first ↑)'}
                            </button>
                            <button
                                type="button"
                                disabled={processing || !data.title.trim() || audienceCount === 0}
                                title={!data.title.trim() ? 'Give your broadcast a title first.' : undefined}
                                onClick={(e) => {
                                    if (!confirm(`Send "${data.title}" to ${audienceCount?.toLocaleString() ?? '?'} users right now?`)) return;
                                    submit(e as any, true);
                                }}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-neon-red px-4 py-3 text-sm font-bold text-white shadow-glow-red transition hover:bg-neon-red/90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {!data.title.trim()
                                    ? 'Add a title to unlock Send'
                                    : audienceCount === 0
                                        ? 'No matching users'
                                        : processing
                                            ? 'Sending…'
                                            : `Send to ${audienceCount?.toLocaleString() ?? '?'} users`}
                            </button>
                            {testResult && (
                                <div className={`rounded-lg border px-3 py-2 text-[11px] ${
                                    testResult.ok
                                        ? 'border-gaming-green/30 bg-gaming-green/5 text-gaming-green'
                                        : 'border-red-500/30 bg-red-500/5 text-red-600'
                                }`}>
                                    {testResult.message}
                                </div>
                            )}
                        </div>
                    )}
                </aside>
            </form>

            {/* Preview modal */}
            {showPreview && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <button type="button" onClick={() => setShowPreview(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white text-ink-900 shadow-2xl">
                        <button type="button" onClick={() => setShowPreview(false)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/10 text-ink-900 backdrop-blur-sm transition hover:bg-black/20">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                        {imagePreview && !youtubeId && <img src={imagePreview} alt="" className="h-48 w-full object-cover sm:h-56" />}
                        {youtubeId && (
                            <div className="relative aspect-video w-full bg-black">
                                <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube.com/embed/${youtubeId}`} title="Preview" frameBorder={0} allowFullScreen />
                            </div>
                        )}
                        <div className="p-6 sm:p-8">
                            <span className="inline-flex items-center gap-2 rounded-full border border-neon-red/30 bg-neon-red/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-neon-red">
                                <span className="h-1.5 w-1.5 rounded-full bg-neon-red" />
                                Announcement
                            </span>
                            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl">{data.title || 'Title preview'}</h2>
                            {previewBody && <div className="prose prose-sm mt-4 max-w-none text-ink-700" dangerouslySetInnerHTML={{ __html: previewBody }} />}
                            {data.cta_label && data.cta_url && (
                                <button type="button" disabled className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-neon-red px-4 py-2 text-sm font-bold text-white shadow-glow-red">
                                    {data.cta_label}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
