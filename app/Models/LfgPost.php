<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class LfgPost extends Model
{
    protected $fillable = [
        'user_id', 'game_id', 'title', 'slug', 'description',
        'spots_needed', 'spots_filled', 'platform', 'rank_min',
        'mic_required', 'language', 'age_requirement', 'requirements_note', 'discord_url',
        'scheduled_at', 'expires_at', 'status',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    protected static function booted(): void
    {
        static::creating(function (LfgPost $post) {
            $base = Str::slug($post->title);
            $slug = $base;
            $count = 1;
            while (static::where('slug', $slug)->exists()) {
                $slug = $base . '-' . $count++;
            }
            $post->slug = $slug;
        });
    }

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'expires_at' => 'datetime',
            'mic_required' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(LfgResponse::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(LfgMessage::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(LfgRating::class);
    }

    public function acceptedMembers()
    {
        return $this->responses()->where('status', 'accepted')->with('user.profile');
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', 'open');
    }

    /**
     * Open posts that haven't expired yet. Posts with at least one accepted
     * teammate (spots_filled > 1) never auto-expire — the session is live,
     * only the host can close it.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'open')
            ->where(function (Builder $q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now())
                    ->orWhere('spots_filled', '>', 1);
            });
    }
}
