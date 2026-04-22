<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Broadcast;
use App\Services\BroadcastDispatcher;
use App\Services\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BroadcastController extends Controller
{
    public function index(): Response
    {
        $broadcasts = Broadcast::with('author:id,name')
            ->withCount([
                'views',
                'views as viewed_count' => fn ($q) => $q->whereNotNull('viewed_at'),
                'views as clicked_count' => fn ($q) => $q->whereNotNull('clicked_at'),
                'views as dismissed_count' => fn ($q) => $q->whereNotNull('dismissed_at'),
            ])
            ->orderByDesc('id')
            ->paginate(25)
            ->through(fn (Broadcast $b) => $this->rowFor($b));

        return Inertia::render('Admin/Broadcasts/Index', [
            'broadcasts' => $broadcasts,
        ]);
    }

    public function create(BroadcastDispatcher $dispatcher): Response
    {
        return Inertia::render('Admin/Broadcasts/Form', [
            'broadcast' => null,
            'allGames' => \App\Models\Game::select('id', 'name')->orderBy('name')->get(),
            'allRegions' => \App\Models\Profile::query()->whereNotNull('region')->distinct()->orderBy('region')->pluck('region'),
            'totalUsers' => \App\Models\User::where('is_banned', false)->count(),
        ]);
    }

    public function store(Request $request, BroadcastDispatcher $dispatcher): RedirectResponse
    {
        $data = $this->validated($request);
        $data['body_html'] = app(HtmlSanitizer::class)->sanitize($data['body'] ?? '');
        $data['created_by'] = $request->user()->id;
        $data['image_path'] = $this->storeImage($request);

        $broadcast = Broadcast::create($data);

        if ($request->boolean('send_now')) {
            $dispatcher->dispatch($broadcast);
            return redirect()->route('admin.broadcasts.index')->with('message', 'Broadcast sent.');
        }

        return redirect()->route('admin.broadcasts.index')->with('message', 'Broadcast saved.');
    }

    public function edit(Broadcast $broadcast): Response
    {
        return Inertia::render('Admin/Broadcasts/Form', [
            'broadcast' => [
                'id' => $broadcast->id,
                'title' => $broadcast->title,
                'body' => $broadcast->body,
                'body_html' => $broadcast->body_html,
                'cta_label' => $broadcast->cta_label,
                'cta_url' => $broadcast->cta_url,
                'youtube_url' => $broadcast->youtube_url,
                'image_url' => $broadcast->image_path ? Storage::disk('public')->url($broadcast->image_path) : null,
                'target_filters' => $broadcast->target_filters ?? [],
                'scheduled_at' => $broadcast->scheduled_at?->format('Y-m-d\TH:i'),
                'sent_at' => $broadcast->sent_at?->format('Y-m-d\TH:i'),
                'push_enabled' => $broadcast->push_enabled,
                'style' => $broadcast->style,
            ],
            'allGames' => \App\Models\Game::select('id', 'name')->orderBy('name')->get(),
            'allRegions' => \App\Models\Profile::query()->whereNotNull('region')->distinct()->orderBy('region')->pluck('region'),
            'totalUsers' => \App\Models\User::where('is_banned', false)->count(),
        ]);
    }

    public function update(Request $request, Broadcast $broadcast): RedirectResponse
    {
        if ($broadcast->sent_at) {
            return back()->withErrors(['general' => 'This broadcast has already been sent and can no longer be edited.']);
        }

        $data = $this->validated($request);
        $data['body_html'] = app(HtmlSanitizer::class)->sanitize($data['body'] ?? '');
        $image = $this->storeImage($request);
        if ($image !== null) {
            if ($broadcast->image_path) {
                Storage::disk('public')->delete($broadcast->image_path);
            }
            $data['image_path'] = $image;
        }

        $broadcast->update($data);

        if ($request->boolean('send_now')) {
            app(BroadcastDispatcher::class)->dispatch($broadcast);
            return redirect()->route('admin.broadcasts.index')->with('message', 'Broadcast sent.');
        }

        return redirect()->route('admin.broadcasts.index')->with('message', 'Broadcast saved.');
    }

    public function destroy(Broadcast $broadcast): RedirectResponse
    {
        if ($broadcast->image_path) {
            Storage::disk('public')->delete($broadcast->image_path);
        }
        $broadcast->delete();

        return redirect()->route('admin.broadcasts.index')->with('message', 'Broadcast deleted.');
    }

    /** Preview audience size without saving — used by the admin form. */
    public function preview(Request $request, BroadcastDispatcher $dispatcher)
    {
        $data = $request->validate([
            'target_filters' => 'nullable|array',
            'target_filters.game_ids' => 'nullable|array',
            'target_filters.game_ids.*' => 'integer',
            'target_filters.regions' => 'nullable|array',
            'target_filters.regions.*' => 'string',
            'target_filters.min_level' => 'nullable|integer|min:1|max:6',
        ]);

        // Lightweight query — don't materialise IDs, just count.
        $fake = new Broadcast(['target_filters' => $data['target_filters'] ?? null]);
        return response()->json(['count' => $dispatcher->targetCount($fake)]);
    }

    /** Manually fire a draft broadcast. */
    public function send(Broadcast $broadcast, BroadcastDispatcher $dispatcher): RedirectResponse
    {
        if ($broadcast->sent_at) {
            return back()->withErrors(['general' => 'Broadcast already sent.']);
        }
        $count = $dispatcher->dispatch($broadcast);
        return redirect()->route('admin.broadcasts.index')->with('message', "Broadcast sent to {$count} users.");
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:140'],
            'body' => ['nullable', 'string', 'max:20000'],
            'cta_label' => ['nullable', 'string', 'max:40'],
            'cta_url' => ['nullable', 'url', 'max:500', new \App\Rules\SafeUrl],
            'youtube_url' => ['nullable', 'url', 'max:500', 'regex:%(?:youtube\.com|youtu\.be)%i'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048', 'dimensions:max_width=3000,max_height=3000'],
            'target_filters' => ['nullable', 'array'],
            'target_filters.game_ids' => ['nullable', 'array'],
            'target_filters.game_ids.*' => ['integer', 'exists:games,id'],
            'target_filters.regions' => ['nullable', 'array'],
            'target_filters.regions.*' => ['string', 'max:50'],
            'target_filters.min_level' => ['nullable', 'integer', 'min:1', 'max:6'],
            'scheduled_at' => ['nullable', 'date'],
            'push_enabled' => ['nullable', 'boolean'],
            'style' => ['required', 'in:popup,banner'],
        ]);
    }

    private function storeImage(Request $request): ?string
    {
        if (!$request->hasFile('image')) return null;
        $file = $request->file('image');
        $name = 'broadcast_' . time() . '_' . \Illuminate\Support\Str::random(8) . '.' . $file->getClientOriginalExtension();
        return $file->storeAs('broadcasts', $name, 'public');
    }

    private function rowFor(Broadcast $b): array
    {
        return [
            'id' => $b->id,
            'title' => $b->title,
            'style' => $b->style,
            'push_enabled' => $b->push_enabled,
            'scheduled_at' => $b->scheduled_at?->toDateTimeString(),
            'sent_at' => $b->sent_at?->toDateTimeString(),
            'audience' => (int) ($b->views_count ?? 0),
            'viewed' => (int) ($b->viewed_count ?? 0),
            'clicked' => (int) ($b->clicked_count ?? 0),
            'dismissed' => (int) ($b->dismissed_count ?? 0),
            'author_name' => $b->author?->name,
        ];
    }
}
