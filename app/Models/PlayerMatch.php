<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PlayerMatch extends Model
{
    protected $table = 'matches';
    protected $fillable = ['user_one_id', 'user_two_id', 'uuid'];
    protected $appends = ['chat_id'];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function booted(): void
    {
        static::creating(function (PlayerMatch $match) {
            if (!$match->uuid) {
                $match->uuid = Str::uuid();
            }
        });
    }

    public function getChatIdAttribute(): string
    {
        return $this->uuid ?? $this->id;
    }

    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'match_id');
    }

    public function partner(int $userId): BelongsTo
    {
        return $this->user_one_id === $userId
            ? $this->userTwo()
            : $this->userOne();
    }
}
