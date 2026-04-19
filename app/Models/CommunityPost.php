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
        'slug', 'user_id', 'game_id', 'title', 'body', 'type',
        'upvotes', 'downvotes', 'comments_count',
    ];

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
     * body_html accessor — renders the markdown body through our safe
     * renderer on each read. For now we don't cache to the DB; the render
     * is fast and this keeps editing cheap.
     */
    public function getBodyHtmlAttribute(): string
    {
        return app(\App\Services\MarkdownRenderer::class)->render($this->body);
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format(\DateTimeInterface::ATOM);
    }

    /** Expose body_html on the JSON payload by default. */
    protected $appends = ['body_html'];
}
