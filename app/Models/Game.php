<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Game extends Model
{
    protected $fillable = [
        'name', 'slug', 'genre', 'platforms', 'cover_image', 'rank_system',
    ];

    protected function casts(): array
    {
        return [
            'platforms' => 'array',
            'rank_system' => 'array',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_games')
            ->withPivot('rank', 'role', 'platform')
            ->withTimestamps();
    }
}
