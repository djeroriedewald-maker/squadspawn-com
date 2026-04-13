<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class LfgPost extends Model
{
    protected $fillable = [
        'user_id', 'game_id', 'title', 'description',
        'spots_needed', 'spots_filled', 'platform', 'rank_min',
        'mic_required', 'language', 'age_requirement', 'requirements_note',
        'scheduled_at', 'status',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
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
}
