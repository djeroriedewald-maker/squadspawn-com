<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Clip extends Model
{
    protected $fillable = ['user_id', 'game_id', 'title', 'url', 'platform', 'thumbnail'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function getEmbedUrlAttribute(): ?string
    {
        if ($this->platform === 'youtube') {
            if (preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/', $this->url, $matches)) {
                return "https://www.youtube.com/embed/{$matches[1]}";
            }
        }
        if ($this->platform === 'twitch') {
            if (preg_match('/clips\.twitch\.tv\/(\w+)/', $this->url, $matches)) {
                return "https://clips.twitch.tv/embed?clip={$matches[1]}&parent=" . request()->getHost();
            }
        }
        return null;
    }
}
