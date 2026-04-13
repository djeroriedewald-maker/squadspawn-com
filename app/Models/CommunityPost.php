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
}
