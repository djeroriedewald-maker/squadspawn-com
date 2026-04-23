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

        // Heartbeat stamp written by DispatchScheduledBroadcasts on every
        // run. If this is stale (or missing) the admin can see at a
        // glance that Forge's cron isn't invoking schedule:run.
        $lastRun = \Illuminate\Support\Facades\Cache::get('broadcasts:scheduler_last_run');

        return Inertia::render('Admin/Broadcasts/Index', [
            'broadcasts' => $broadcasts,
            'scheduler' => [
                'last_run_at' => $lastRun,
                'healthy' => $lastRun
                    ? \Illuminate\Support\Carbon::parse($lastRun)->diffInMinutes(now()) < 3
                    : false,
            ],
        ]);
    }

    /**
     * Scheduler diagnostics — exposes the exact file paths admins need
     * to copy into Forge's scheduled-job form, plus a live cron health
     * read-out. Lets us debug cron setup from the browser without SSH.
     */
    public function diagnostics(): Response
    {
        $lastRun = \Illuminate\Support\Facades\Cache::get('broadcasts:scheduler_last_run');
        $baseRaw = base_path();
        $artisanRaw = base_path('artisan');

        // Forge uses zero-downtime releases: base_path() ends up pointing
        // at /home/forge/site/releases/<hash>, which changes on every
        // deploy. A cron job hard-coded to that path breaks as soon as
        // the next deploy runs. Use the `current` symlink when we detect
        // a releases-style layout — that stays stable across deploys.
        [$stableArtisan, $stableBase, $usesSymlink] = $this->stableArtisanPath($baseRaw);

        // Likewise: PHP_BINARY inside a web request is the FPM binary
        // (e.g. php-fpm8.3), which is NOT invokable from cron. Fall back
        // to the CLI binary next to it when we detect FPM, and otherwise
        // just use `php` (the server's PATH picks the CLI build).
        $phpBinary = $this->cliPhpBinary();

        $suggestedCommand = $phpBinary . ' ' . $stableArtisan . ' schedule:run';

        return Inertia::render('Admin/Broadcasts/Diagnostics', [
            'paths' => [
                'artisan' => $stableArtisan,
                'artisan_exists' => file_exists($stableArtisan),
                'artisan_raw' => $artisanRaw,
                'uses_symlink' => $usesSymlink,
                'php_binary' => $phpBinary,
                'base_path' => $stableBase,
                'app_timezone' => config('app.timezone'),
                'now_server' => now()->toIso8601String(),
            ],
            'suggested_cron' => $suggestedCommand,
            'scheduler' => [
                'last_run_at' => $lastRun,
                'healthy' => $lastRun
                    ? \Illuminate\Support\Carbon::parse($lastRun)->diffInMinutes(now()) < 3
                    : false,
            ],
            'pending_scheduled' => Broadcast::whereNull('sent_at')
                ->whereNotNull('scheduled_at')
                ->orderBy('scheduled_at')
                ->get()
                ->map(fn ($b) => [
                    'id' => $b->id,
                    'title' => $b->title,
                    'scheduled_at' => $b->scheduled_at?->toIso8601String(),
                    'is_due' => $b->scheduled_at && $b->scheduled_at->isPast(),
                ]),
        ]);
    }

    /**
     * Dedicated analytics view — aggregate stats across every sent
     * broadcast + a per-broadcast breakdown sorted by engagement. Lets
     * you see reach and click-through at a glance without opening the
     * edit screen.
     */
    public function analytics(): Response
    {
        $broadcasts = Broadcast::with('author:id,name')
            ->withCount([
                'views',
                'views as viewed_count' => fn ($q) => $q->whereNotNull('viewed_at'),
                'views as clicked_count' => fn ($q) => $q->whereNotNull('clicked_at'),
                'views as dismissed_count' => fn ($q) => $q->whereNotNull('dismissed_at'),
            ])
            ->whereNotNull('sent_at')
            ->orderByDesc('sent_at')
            ->take(50)
            ->get()
            ->map(fn (Broadcast $b) => $this->analyticsRowFor($b));

        // Aggregates: sum of reach, view rate, click-through, push reach.
        $totals = [
            'sent_count' => $broadcasts->count(),
            'total_audience' => (int) $broadcasts->sum('audience'),
            'total_viewed' => (int) $broadcasts->sum('viewed'),
            'total_clicked' => (int) $broadcasts->sum('clicked'),
            'total_dismissed' => (int) $broadcasts->sum('dismissed'),
            'total_push_sent' => (int) $broadcasts->sum('push_sent'),
            'total_push_eligible' => (int) $broadcasts->sum('push_eligible'),
        ];
        $totals['view_rate'] = $totals['total_audience'] > 0
            ? round(($totals['total_viewed'] / $totals['total_audience']) * 100, 1)
            : null;
        $totals['click_rate'] = $totals['total_viewed'] > 0
            ? round(($totals['total_clicked'] / $totals['total_viewed']) * 100, 1)
            : null;
        $totals['push_rate'] = $totals['total_push_eligible'] > 0
            ? round(($totals['total_push_sent'] / $totals['total_push_eligible']) * 100, 1)
            : null;

        return Inertia::render('Admin/Broadcasts/Analytics', [
            'broadcasts' => $broadcasts->values(),
            'totals' => $totals,
        ]);
    }

    /**
     * Manually invoke the scheduler command — surfaces whether our
     * artisan command itself is healthy, independent of whether Forge's
     * cron is wired up. After this runs, the heartbeat flips to green
     * immediately, so the admin can tell "code works, cron is broken"
     * from "code is broken" with one click.
     */
    public function runScheduler(): \Illuminate\Http\JsonResponse
    {
        try {
            \Illuminate\Support\Facades\Artisan::call('broadcasts:dispatch-scheduled');
            $output = \Illuminate\Support\Facades\Artisan::output();
            return response()->json([
                'ok' => true,
                'output' => $output ?: '(no output — no broadcasts due)',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resolve a cron-safe artisan path. Returns [$artisanPath, $basePath,
     * $usesSymlink]. For Forge zero-downtime deploys we rewrite
     * `/releases/<hash>/` to `/current/` so the cron survives redeploys.
     */
    private function stableArtisanPath(string $baseRaw): array
    {
        $normalised = str_replace('\\', '/', $baseRaw);
        if (preg_match('#^(.*)/releases/[^/]+(/.*)?$#', $normalised, $m)) {
            $stableBase = $m[1] . '/current';
            return [$stableBase . '/artisan', $stableBase, true];
        }
        return [$baseRaw . DIRECTORY_SEPARATOR . 'artisan', $baseRaw, false];
    }

    /**
     * Guess a cron-usable PHP binary that matches the FPM version the
     * web server is running on. On Forge the CLI `php` often points at
     * an older version (e.g. 8.2) while FPM runs 8.3, so using bare
     * `php` in cron causes a Composer platform_check fatal. We extract
     * the version from PHP_BINARY (which IS the FPM binary in web
     * requests) and suggest the version-pinned CLI like `php8.3`.
     */
    private function cliPhpBinary(): string
    {
        $binary = PHP_BINARY ?: 'php';

        // Extract "8.3" from "/usr/sbin/php-fpm8.3" or "/usr/bin/php8.3"
        if (preg_match('/php(?:-fpm)?(\d+\.\d+)/', $binary, $m)) {
            $version = $m[1];
            // Prefer a verified absolute path; otherwise a bare
            // version-pinned name that Forge's PATH resolves.
            foreach (["/usr/bin/php{$version}", "/usr/local/bin/php{$version}"] as $candidate) {
                if (file_exists($candidate)) {
                    return $candidate;
                }
            }
            return "php{$version}";
        }

        // Fallback: strip `-fpm` if present, else bare `php`.
        if (str_contains($binary, 'fpm')) {
            $stripped = str_replace('-fpm', '', $binary);
            if (file_exists($stripped)) return $stripped;
            return 'php';
        }
        return $binary;
    }

    private function analyticsRowFor(Broadcast $b): array
    {
        $audience = (int) ($b->views_count ?? 0);
        $viewed = (int) ($b->viewed_count ?? 0);
        $clicked = (int) ($b->clicked_count ?? 0);

        return [
            'id' => $b->id,
            'title' => $b->title,
            'style' => $b->style,
            'push_enabled' => (bool) $b->push_enabled,
            'sent_at' => $b->sent_at?->toDateTimeString(),
            'sent_at_human' => $b->sent_at?->diffForHumans(),
            'audience' => $audience,
            'viewed' => $viewed,
            'clicked' => $clicked,
            'dismissed' => (int) ($b->dismissed_count ?? 0),
            'push_eligible' => (int) ($b->push_eligible_count ?? 0),
            'push_sent' => (int) ($b->push_sent_count ?? 0),
            'view_rate' => $audience > 0 ? round(($viewed / $audience) * 100, 1) : null,
            'click_rate' => $viewed > 0 ? round(($clicked / $viewed) * 100, 1) : null,
            'author_name' => $b->author?->name,
        ];
    }

    public function create(BroadcastDispatcher $dispatcher): Response
    {
        return Inertia::render('Admin/Broadcasts/Form', [
            'broadcast' => null,
            'allGames' => \App\Models\Game::select('id', 'name')->orderBy('name')->get(),
            'allRegions' => \App\Models\Profile::query()->whereNotNull('region')->distinct()->orderBy('region')->pluck('region'),
            'totalUsers' => \App\Models\User::where('is_banned', false)->count(),
            'internalPages' => $this->internalPages(),
            'appUrl' => rtrim(config('app.url'), '/'),
        ]);
    }

    public function store(Request $request, BroadcastDispatcher $dispatcher): RedirectResponse
    {
        $data = $this->validated($request);
        $data['body_html'] = app(HtmlSanitizer::class)->sanitize($data['body'] ?? '');
        $data['created_by'] = $request->user()->id;
        $data['image_path'] = $this->storeImage($request);

        $broadcast = Broadcast::create($data);

        // Send-now only wins if there's no future scheduled_at. If the
        // admin picked a future date, the cron picks it up when due — we
        // must not also fire it immediately or the broadcast would land
        // twice (once now, once when scheduled).
        $shouldSendNow = $request->boolean('send_now')
            && (!$broadcast->scheduled_at || $broadcast->scheduled_at->isPast());

        if ($shouldSendNow) {
            $dispatcher->dispatch($broadcast);
            return redirect()->route('admin.broadcasts.index')->with('message', 'Broadcast sent.');
        }

        if ($broadcast->scheduled_at && $broadcast->scheduled_at->isFuture()) {
            // Message keeps the tz-correct formatting to the list view
            // (which renders in the viewer's local timezone). Saying
            // "scheduled for 07:12" here would be UTC and misleading.
            return redirect()->route('admin.broadcasts.index')
                ->with('message', 'Broadcast scheduled. Check the row below for the exact fire time in your local timezone.');
        }

        // Drafts go straight back into the edit screen so the admin can
        // hit "Send test to me" without re-clicking through the list.
        return redirect()->route('admin.broadcasts.edit', $broadcast->id)
            ->with('message', 'Draft saved. Use "Send test to me" to check the popup + push before going live.');
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
            'internalPages' => $this->internalPages(),
            'appUrl' => rtrim(config('app.url'), '/'),
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
        $broadcast->refresh();

        $shouldSendNow = $request->boolean('send_now')
            && (!$broadcast->scheduled_at || $broadcast->scheduled_at->isPast());

        if ($shouldSendNow) {
            app(BroadcastDispatcher::class)->dispatch($broadcast);
            return redirect()->route('admin.broadcasts.index')->with('message', 'Broadcast sent.');
        }

        if ($broadcast->scheduled_at && $broadcast->scheduled_at->isFuture()) {
            return redirect()->route('admin.broadcasts.index')
                ->with('message', 'Broadcast scheduled. Check the row below for the exact fire time in your local timezone.');
        }

        return redirect()->route('admin.broadcasts.index')->with('message', 'Broadcast saved.');
    }

    public function destroy(Broadcast $broadcast): RedirectResponse
    {
        $title = $broadcast->title;
        $broadcastId = $broadcast->id;
        if ($broadcast->image_path) {
            Storage::disk('public')->delete($broadcast->image_path);
        }
        $broadcast->delete();

        \App\Services\AdminAudit::log('broadcast.deleted', null, [
            'broadcast_id' => $broadcastId,
            'title' => $title,
        ]);

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
        $pushed = $broadcast->refresh()->push_sent_count ?? 0;

        \App\Services\AdminAudit::log('broadcast.sent', null, [
            'broadcast_id' => $broadcast->id,
            'title' => $broadcast->title,
            'recipients' => $count,
            'push_sent' => $pushed,
        ]);

        return redirect()->route('admin.broadcasts.index')->with('message', "Broadcast sent to {$count} users ({$pushed} push).");
    }

    /**
     * Fire the broadcast only at the admin's own account — useful for
     * smoke-testing the popup + push pipeline without spamming users.
     * Skips the sent_at stamp so you can still send the real broadcast
     * to the target audience afterwards.
     */
    public function sendTest(Request $request, Broadcast $broadcast, BroadcastDispatcher $dispatcher): \Illuminate\Http\JsonResponse
    {
        $userId = $request->user()->id;

        // Upsert the view row AND reset its dismissed state — otherwise
        // a previous test run (or real delivery) leaves dismissed_at set
        // and the popup stays hidden even though we "resent" it.
        \App\Models\BroadcastView::updateOrCreate(
            ['broadcast_id' => $broadcast->id, 'user_id' => $userId],
            ['dismissed_at' => null, 'viewed_at' => null, 'clicked_at' => null],
        );
        $request->user()->notify(new \App\Notifications\BroadcastNotification($broadcast));
        \Illuminate\Support\Facades\Cache::forget("user:{$userId}:unread");

        $hasSubscription = \App\Models\PushSubscription::where('user_id', $userId)->exists();
        $wantsPush = $request->user()->wantsPush('announcement');

        return response()->json([
            'ok' => true,
            'has_push_subscription' => $hasSubscription,
            'wants_push' => $wantsPush,
            'push_enabled' => $broadcast->push_enabled,
            'message' => $this->testDiagnosticMessage($hasSubscription, $wantsPush, $broadcast->push_enabled),
        ]);
    }

    private function testDiagnosticMessage(bool $hasSub, bool $wantsPush, bool $pushEnabled): string
    {
        $popup = 'In-app popup: delivered — reload any page and it should appear.';
        if (!$pushEnabled) return $popup . ' Push disabled on this broadcast.';
        if (!$hasSub) return $popup . ' Push: no subscription on file for your account. Enable push from the prompt in your app.';
        if (!$wantsPush) return $popup . ' Push: suppressed because you toggled "Platform announcements" off in notification preferences.';
        return $popup . ' Push: fired — check your device within 30 seconds.';
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

    /**
     * The in-app pages an admin is most likely to link to from a
     * broadcast CTA. Rendered as quick-pick chips in the form.
     */
    private function internalPages(): array
    {
        return [
            ['label' => 'Dashboard',      'path' => '/dashboard'],
            ['label' => 'LFG',            'path' => '/lfg'],
            ['label' => 'Discover',       'path' => '/discover'],
            ['label' => 'Games',          'path' => '/games'],
            ['label' => 'Community',      'path' => '/community'],
            ['label' => 'Clips',          'path' => '/clips'],
            ['label' => 'Announcements',  'path' => '/announcements'],
            ['label' => "What's new",     'path' => '/changelog'],
            ['label' => 'Profile setup',  'path' => '/profile/setup'],
            ['label' => 'Help centre',    'path' => '/help'],
        ];
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
            'push_eligible' => (int) ($b->push_eligible_count ?? 0),
            'push_sent' => (int) ($b->push_sent_count ?? 0),
            'author_name' => $b->author?->name,
        ];
    }
}
