<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Game extends Model
{
    protected $fillable = [
        'name', 'slug', 'genre', 'platforms', 'cover_image', 'rank_system', 'roles',
        'description', 'rawg_id', 'released_at', 'popularity_score',
    ];

    protected function casts(): array
    {
        return [
            'platforms' => 'array',
            'rank_system' => 'array',
            'roles' => 'array',
            'released_at' => 'date',
            'popularity_score' => 'integer',
        ];
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_games')
            ->withPivot('rank', 'role', 'platform')
            ->withTimestamps();
    }
}
