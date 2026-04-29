<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\EventLike;
use App\Models\EventRegistration;
use App\Models\Game;
use App\Services\HtmlSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EventController extends Controller
{
    /**
     * Public landing — featured first, then upcoming. Skip pending /
     * rejected / cancelled so casual visitors only ever see things they
     * can actually attend.
     */
    public function index(): Response
    {
        $now = now();

        $events = Event::query()
            ->with(['host:id,name', 'host.profile:user_id,username,avatar', 'game:id,name,slug,cover_image'])
            ->withCount('registrations')
            ->withCount('likes')
            ->where('status', 'published')
            ->where(function ($q) use ($now) {
                $q->whereNull('ends_at')->where('scheduled_for', '>=', $now->copy()->subHours(3))
                  ->orWhere('ends_at', '>=', $now);
            })
            ->orderByRaw('CASE WHEN tier = ? AND (featured_until IS NULL OR featured_until >= ?) THEN 0 ELSE 1 END', ['featured', $now])
            ->orderBy('scheduled_for', 'asc')
            ->take(60)
            ->get();

        return Inertia::render('Events/Index', [
            'events' => $events,
            'canHost' => auth()->check(),
            'seo' => [
                'title' => 'Gaming events · tournaments, watch parties, giveaways · SquadSpawn',
                'description' => 'Join the SquadSpawn community for tournaments, livestream watch parties, in-game giveaways and meetups. Browse upcoming gaming events or host your own.',
                'image' => url('/images/event_banner.jpg'),
            ],
        ]);
    }

    public function show(Event $event): Response
    {
        // pending / rejected / cancelled events are only visible to the host
        // and admins so a freshly-submitted event isn't crawlable yet.
        $userId = auth()->id();
        $isHost = $userId === $event->user_id;
        $isAdmin = auth()->user()?->is_admin || auth()->user()?->is_owner || auth()->user()?->is_moderator;
        if (!$event->isPublished() && !$isHost && !$isAdmin) {
            abort(404);
        }

        $event->load(['host:id,name', 'host.profile:user_id,username,avatar', 'game:id,name,slug,cover_image']);
        $event->loadCount(['registrations', 'likes']);

        $isRegistered = $userId
            ? EventRegistration::where('event_id', $event->id)->where('user_id', $userId)->exists()
            : false;
        $isLiked = $userId
            ? EventLike::where('event_id', $event->id)->where('user_id', $userId)->exists()
            : false;

        return Inertia::render('Events/Show', [
            'event' => $event,
            'isRegistered' => $isRegistered,
            'isLiked' => $isLiked,
            'isHost' => $isHost,
            'isAdmin' => $isAdmin,
            'seo' => $this->seoFor($event),
            'jsonLd' => $this->jsonLdFor($event),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Events/Create', [
            'games' => Game::orderBy('name')->get(['id', 'name', 'slug', 'cover_image']),
            'types' => Event::TYPES,
            'formats' => Event::FORMATS,
        ]);
    }

    public function store(Request $request, HtmlSanitizer $sanitizer): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:' . implode(',', Event::TYPES)],
            'title' => ['required', 'string', 'max:100'],
            'body_html' => ['nullable', 'string', 'max:50000'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'video_url' => ['nullable', 'url', 'max:500', new \App\Rules\SafeUrl],
            'scheduled_for' => ['required', 'date', 'after:now'],
            'ends_at' => ['nullable', 'date', 'after:scheduled_for'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'region' => ['nullable', 'string', 'max:50'],
            'game_id' => ['nullable', 'exists:games,id'],
            'max_capacity' => ['nullable', 'integer', 'min:2', 'max:10000'],
            'format' => ['required', 'in:' . implode(',', Event::FORMATS)],
            'external_link' => ['nullable', 'url', 'max:500', new \App\Rules\SafeUrl],
        ]);

        $user = auth()->user();
        $autoPublish = $this->canAutoPublish($user);

        $event = new Event($validated);
        $event->user_id = $user->id;
        $event->body_html = !empty($validated['body_html']) ? $sanitizer->sanitize($validated['body_html']) : null;
        $event->status = $autoPublish ? 'published' : 'pending_review';
        if ($autoPublish) {
            $event->approved_at = now();
            $event->approved_by = $user->id;
        }
        $event->save();

        $message = $autoPublish
            ? 'Event published!'
            : 'Event submitted — we keep the bar high, so an admin will review it within 24 hours. You\'ll see it go live here once approved.';

        return redirect()->route('events.show', $event)->with('message', $message);
    }

    public function edit(Event $event): Response
    {
        // Hosts edit their own; admins edit anything (useful for typo fixes
        // before approval). Other users get 403 — never 404, because that
        // would leak whether the slug exists.
        $user = auth()->user();
        $isAdmin = $user->is_admin || $user->is_owner || $user->is_moderator;
        abort_unless($event->user_id === $user->id || $isAdmin, 403);

        return Inertia::render('Events/Edit', [
            'event' => $event,
            'games' => Game::orderBy('name')->get(['id', 'name', 'slug', 'cover_image']),
            'types' => Event::TYPES,
            'formats' => Event::FORMATS,
        ]);
    }

    public function update(Request $request, HtmlSanitizer $sanitizer, Event $event): RedirectResponse
    {
        $user = auth()->user();
        $isAdmin = $user->is_admin || $user->is_owner || $user->is_moderator;
        abort_unless($event->user_id === $user->id || $isAdmin, 403);

        $validated = $request->validate([
            'type' => ['required', 'in:' . implode(',', Event::TYPES)],
            'title' => ['required', 'string', 'max:100'],
            'body_html' => ['nullable', 'string', 'max:50000'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'video_url' => ['nullable', 'url', 'max:500', new \App\Rules\SafeUrl],
            'scheduled_for' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after:scheduled_for'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'region' => ['nullable', 'string', 'max:50'],
            'game_id' => ['nullable', 'exists:games,id'],
            'max_capacity' => ['nullable', 'integer', 'min:2', 'max:10000'],
            'format' => ['required', 'in:' . implode(',', Event::FORMATS)],
            'external_link' => ['nullable', 'url', 'max:500', new \App\Rules\SafeUrl],
        ]);

        if (!empty($validated['body_html'])) {
            $validated['body_html'] = $sanitizer->sanitize($validated['body_html']);
        }

        // Host edit on a published event sends it back to pending_review so
        // an admin can re-check the changed copy / cover. Admin edits leave
        // status untouched — they're trusted and may be fixing typos.
        $wasPublished = $event->status === 'published';
        $hostEditing = $event->user_id === $user->id && !$isAdmin;
        if ($wasPublished && $hostEditing) {
            $validated['status'] = 'pending_review';
            $validated['approved_at'] = null;
            $validated['approved_by'] = null;
        }

        $event->update($validated);

        $message = ($wasPublished && $hostEditing)
            ? 'Event updated and re-submitted for review.'
            : 'Event updated.';

        return redirect()->route('events.show', $event)->with('message', $message);
    }

    public function register(Event $event): RedirectResponse
    {
        abort_unless($event->isPublished(), 404);
        abort_if($event->isFull(), 422, 'Event is full.');

        EventRegistration::firstOrCreate([
            'event_id' => $event->id,
            'user_id' => auth()->id(),
        ]);

        return back()->with('message', 'You\'re in. See you there.');
    }

    public function unregister(Event $event): RedirectResponse
    {
        EventRegistration::where('event_id', $event->id)
            ->where('user_id', auth()->id())
            ->delete();

        return back()->with('message', 'You\'ve been removed from this event.');
    }

    public function like(Event $event): JsonResponse
    {
        abort_unless($event->isPublished(), 404);
        $userId = auth()->id();

        $existing = EventLike::where('event_id', $event->id)->where('user_id', $userId)->first();
        if ($existing) {
            $existing->delete();
            $liked = false;
        } else {
            EventLike::create(['event_id' => $event->id, 'user_id' => $userId]);
            $liked = true;
        }

        return response()->json([
            'liked' => $liked,
            'count' => $event->likes()->count(),
        ]);
    }

    public function cancel(Event $event): RedirectResponse
    {
        abort_unless($event->user_id === auth()->id(), 403);
        $event->update(['status' => 'cancelled']);
        return redirect()->route('events.index')->with('message', 'Event cancelled.');
    }

    public function uploadCover(Request $request): JsonResponse
    {
        $request->validate([
            'cover' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096', 'dimensions:min_width=600,min_height=300,max_width=4000,max_height=4000'],
        ]);

        $file = $request->file('cover');
        $filename = 'event_' . auth()->id() . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('event-covers', $filename, 'public');

        return response()->json(['url' => '/storage/' . $path]);
    }

    /**
     * Auto-publish policy:
     *  - Admins / owners / moderators always.
     *  - Users with ≥2 previously published or completed events become
     *    "trusted hosts" and graduate out of the moderation queue.
     *  - Everyone else lands in pending_review.
     */
    private function canAutoPublish(\App\Models\User $user): bool
    {
        if ($user->is_admin || $user->is_owner || $user->is_moderator) {
            return true;
        }
        $priorEvents = Event::where('user_id', $user->id)
            ->whereIn('status', ['published', 'completed'])
            ->count();
        return $priorEvents >= 2;
    }

    private function seoFor(Event $event): array
    {
        $description = $event->body_html
            ? \Illuminate\Support\Str::limit(trim(strip_tags($event->body_html)), 160, '…')
            : "Join {$event->title} on SquadSpawn — a community gaming event scheduled for " . $event->scheduled_for->format('M j, Y');

        return [
            'title' => $event->title . ' · SquadSpawn Events',
            'description' => $description,
            'image' => $event->cover_image ?: url('/images/event_banner.jpg'),
            'noindex' => !$event->isPublished(),
        ];
    }

    /**
     * schema.org/Event JSON-LD — Google rich-result eligible. Keep
     * eventStatus current so cancelled events drop out of the rich card
     * instead of misleading attendees.
     */
    private function jsonLdFor(Event $event): array
    {
        $statusMap = [
            'published' => 'EventScheduled',
            'cancelled' => 'EventCancelled',
            'completed' => 'EventScheduled',
        ];

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Event',
            'name' => $event->title,
            'description' => $event->body_html ? trim(strip_tags($event->body_html)) : null,
            'startDate' => $event->scheduled_for->toIso8601String(),
            'endDate' => $event->ends_at?->toIso8601String(),
            'eventStatus' => 'https://schema.org/' . ($statusMap[$event->status] ?? 'EventScheduled'),
            'eventAttendanceMode' => 'https://schema.org/OnlineEventAttendanceMode',
            'location' => [
                '@type' => 'VirtualLocation',
                'url' => url(route('events.show', $event)),
            ],
            'image' => [$event->cover_image ?: url('/images/event_banner.jpg')],
            'organizer' => [
                '@type' => 'Person',
                'name' => $event->host->profile->username ?? $event->host->name,
            ],
        ];
    }
}
