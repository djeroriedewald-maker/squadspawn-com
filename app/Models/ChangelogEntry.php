<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ChangelogEntry extends Model
{
    protected $fillable = [
        'version', 'slug', 'title', 'body', 'body_html',
        'tag', 'is_highlight', 'published_at', 'user_id',
    ];

    protected function casts(): array
    {
        return [
            'is_highlight' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Only entries that are live (published_at in the past). */
    public function scopePublished(Builder $q): Builder
    {
        return $q->whereNotNull('published_at')->where('published_at', '<=', now());
    }

    /** Human-friendly tag label. */
    public function tagLabel(): string
    {
        return match ($this->tag) {
            'feature' => 'New Feature',
            'improvement' => 'Improvement',
            'fix' => 'Fix',
            'security' => 'Security',
            default => ucfirst((string) $this->tag),
        };
    }
}
