<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChangelogEntry;
use App\Services\HtmlSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChangelogController extends Controller
{
    public function index(): Response
    {
        $entries = ChangelogEntry::with('author:id,name', 'author.profile:user_id,username')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->paginate(25)
            ->through(fn (ChangelogEntry $e) => [
                'id' => $e->id,
                'version' => $e->version,
                'slug' => $e->slug,
                'title' => $e->title,
                'tag' => $e->tag,
                'tag_label' => $e->tagLabel(),
                'is_highlight' => $e->is_highlight,
                'published_at' => $e->published_at?->toDateTimeString(),
                'is_published' => $e->published_at && $e->published_at->lte(now()),
                'is_scheduled' => $e->published_at && $e->published_at->gt(now()),
                'author_name' => $e->author?->profile?->username ?? $e->author?->name,
            ]);

        return Inertia::render('Admin/Changelog/Index', [
            'entries' => $entries,
            'suggestedVersion' => $this->suggestNextVersion(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Changelog/Form', [
            'entry' => null,
            'suggestedVersion' => $this->suggestNextVersion(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);

        $data['user_id'] = $request->user()->id;
        $data['slug'] = $this->uniqueSlug($data['version'], $data['title']);
        $data['body_html'] = app(HtmlSanitizer::class)->sanitize($data['body'] ?? '');

        ChangelogEntry::create($data);
        \Illuminate\Support\Facades\Cache::forget('changelog:latest_published_at');

        return redirect()->route('admin.changelog.index')->with('message', 'Release published.');
    }

    public function edit(ChangelogEntry $entry): Response
    {
        return Inertia::render('Admin/Changelog/Form', [
            'entry' => [
                'id' => $entry->id,
                'version' => $entry->version,
                'slug' => $entry->slug,
                'title' => $entry->title,
                'body' => $entry->body,
                'tag' => $entry->tag,
                'is_highlight' => $entry->is_highlight,
                'published_at' => $entry->published_at?->format('Y-m-d\TH:i'),
            ],
            'suggestedVersion' => null,
        ]);
    }

    public function update(Request $request, ChangelogEntry $entry): RedirectResponse
    {
        $data = $this->validated($request);

        // Only refresh the slug when the title or version changes so deep
        // links remain stable for minor edits.
        if ($entry->title !== $data['title'] || $entry->version !== $data['version']) {
            $data['slug'] = $this->uniqueSlug($data['version'], $data['title'], $entry->id);
        }
        $data['body_html'] = app(HtmlSanitizer::class)->sanitize($data['body'] ?? '');

        $entry->update($data);
        \Illuminate\Support\Facades\Cache::forget('changelog:latest_published_at');

        return redirect()->route('admin.changelog.index')->with('message', 'Release saved.');
    }

    public function destroy(ChangelogEntry $entry): RedirectResponse
    {
        $entry->delete();
        \Illuminate\Support\Facades\Cache::forget('changelog:latest_published_at');

        return redirect()->route('admin.changelog.index')->with('message', 'Release deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'version' => ['required', 'string', 'max:32', 'regex:/^v?\d+(\.\d+){0,3}(-[a-zA-Z0-9]+)?$/'],
            'title' => ['required', 'string', 'max:140'],
            'body' => ['nullable', 'string', 'max:20000'],
            'tag' => ['required', 'in:feature,improvement,fix,security'],
            'is_highlight' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
        ]);
    }

    private function uniqueSlug(string $version, string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($version . '-' . $title);
        if ($base === '') {
            $base = Str::random(8);
        }
        $slug = $base;
        $i = 2;
        while (ChangelogEntry::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()
        ) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }

    /** Bump the patch segment of the most recent version as a nudge. */
    private function suggestNextVersion(): string
    {
        $latest = ChangelogEntry::orderByDesc('id')->value('version');
        if (!$latest) return '1.0.0';

        $parts = explode('.', ltrim($latest, 'v'));
        $parts = array_pad($parts, 3, '0');
        $parts[2] = (string) (((int) $parts[2]) + 1);
        return implode('.', array_slice($parts, 0, 3));
    }
}
