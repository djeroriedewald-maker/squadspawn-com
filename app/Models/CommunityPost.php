<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class CommunityPost extends Model
{
    protected $fillable = [
        'slug', 'user_id', 'game_id', 'title', 'body', 'body_html', 'type',
        'upvotes', 'downvotes', 'comments_count',
        'hidden_at', 'hidden_by_user_id', 'hidden_reason',
        'locked_at', 'pinned_at',
    ];

    protected function casts(): array
    {
        return [
            'hidden_at' => 'datetime',
            'locked_at' => 'datetime',
            'pinned_at' => 'datetime',
        ];
    }

    public function hiddenBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'hidden_by_user_id');
    }

    public function scopeVisibleTo(Builder $query, ?User $viewer): Builder
    {
        if ($viewer && $viewer->canModerate()) return $query; // mods see hidden
        return $query->whereNull('hidden_at');
    }

    protected static function booted(): void
    {
        static::creating(function (CommunityPost $post) {
            if (empty($post->slug)) {
                $base = Str::slug($post->title);
                $slug = $base;
                $i = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $base . '-' . $i++;
                }
                $post->slug = $slug;
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(PostComment::class);
    }

    public function votes(): HasMany
    {
        return $this->hasMany(PostVote::class);
    }

    public function scopeHot(Builder $query): Builder
    {
        return $query->orderByRaw('(upvotes - downvotes) DESC');
    }

    public function scopeNew(Builder $query): Builder
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * body_html accessor — prefers the stored WYSIWYG HTML, falls back to
     * rendering the legacy markdown body for posts written before the
     * Tiptap editor landed. That way existing posts keep rendering without
     * a data migration.
     */
    public function getBodyHtmlAttribute(): string
    {
        $stored = $this->attributes['body_html'] ?? null;
        if (!empty($stored)) return $stored;
        return app(\App\Services\MarkdownRenderer::class)->render($this->body ?? '');
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    /** Expose body_html on the JSON payload by default. */
    protected $appends = ['body_html'];
}
