<?php

namespace App\Http\Controllers;

use App\Models\ChangelogEntry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChangelogController extends Controller
{
    public function index(Request $request): Response
    {
        $entries = ChangelogEntry::published()
            ->with('author:id,name')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (ChangelogEntry $e) => $this->present($e));

        $latest = $entries->first();
        $user = $request->user();
        $lastSeen = $user?->profile?->changelog_last_seen_at;

        // Flag each entry as "new since you last visited" — used for the
        // subtle NEW pill in the timeline.
        $entries = $entries->map(function ($e) use ($lastSeen) {
            $e['is_new'] = $lastSeen === null
                ? true
                : \Illuminate\Support\Carbon::parse($e['published_at_raw'])->gt($lastSeen);
            return $e;
        });

        // Mark as seen — after this page load the dot in the nav goes away.
        if ($user?->profile && $latest) {
            $user->profile->forceFill([
                'changelog_last_seen_at' => $latest['published_at_raw'],
            ])->save();
        }

        return Inertia::render('Changelog/Index', [
            'entries' => $entries->values(),
            'latestVersion' => $latest['version'] ?? null,
            'seo' => [
                'title' => 'Changelog · SquadSpawn',
                'description' => 'Everything new on SquadSpawn — feature drops, improvements, fixes, and security updates. Stay in the loop with every release.',
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $entry = ChangelogEntry::published()
            ->with('author:id,name')
            ->where('slug', $slug)
            ->firstOrFail();

        return Inertia::render('Changelog/Show', [
            'entry' => $this->present($entry),
            'seo' => [
                'title' => $entry->title . ' · Changelog · SquadSpawn',
                'description' => \Illuminate\Support\Str::limit(strip_tags($entry->body_html ?? $entry->body ?? ''), 160),
            ],
        ]);
    }

    private function present(ChangelogEntry $e): array
    {
        return [
            'id' => $e->id,
            'version' => $e->version,
            'slug' => $e->slug,
            'title' => $e->title,
            'body_html' => $e->body_html,
            'tag' => $e->tag,
            'tag_label' => $e->tagLabel(),
            'is_highlight' => $e->is_highlight,
            'published_at' => $e->published_at?->toIso8601String(),
            'published_at_raw' => $e->published_at?->toDateTimeString(),
            'published_at_human' => $e->published_at?->diffForHumans(),
            'author_name' => $e->author?->name,
        ];
    }
}
