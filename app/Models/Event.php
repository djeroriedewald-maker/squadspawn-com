<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Event extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'slug', 'body_html', 'cover_image',
        'video_url', 'scheduled_for', 'ends_at', 'timezone', 'region',
        'game_id', 'max_capacity', 'format', 'external_link', 'status',
        'rejected_reason', 'tier', 'featured_until', 'approved_at', 'approved_by',
    ];

    public const TYPES = ['tournament', 'livestream', 'giveaway', 'meetup', 'training', 'other'];
    public const FORMATS = ['solo', 'team'];
    public const STATUSES = ['pending_review', 'published', 'rejected', 'cancelled', 'completed'];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::creating(function (Event $event) {
            if (empty($event->slug)) {
                $base = Str::slug($event->title) ?: 'event';
                $slug = $base;
                $count = 1;
                while (static::where('slug', $slug)->exists()) {
                    $slug = $base . '-' . $count++;
                }
                $event->slug = $slug;
            }
        });
    }

    protected function casts(): array
    {
        return [
            'scheduled_for' => 'datetime',
            'ends_at' => 'datetime',
            'featured_until' => 'datetime',
            'approved_at' => 'datetime',
            'max_capacity' => 'integer',
        ];
    }

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(EventRegistration::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(EventLike::class);
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending_review';
    }

    public function isFull(): bool
    {
        if ($this->max_capacity === null) {
            return false;
        }
        return $this->registrations()->count() >= $this->max_capacity;
    }
}
