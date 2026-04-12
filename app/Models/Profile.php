<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    protected $fillable = [
        'user_id', 'username', 'avatar', 'bio', 'looking_for',
        'region', 'timezone', 'available_times', 'socials',
        'is_creator', 'stream_url', 'is_live',
    ];

    protected function casts(): array
    {
        return [
            'available_times' => 'array',
            'socials' => 'array',
            'is_creator' => 'boolean',
            'is_live' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
