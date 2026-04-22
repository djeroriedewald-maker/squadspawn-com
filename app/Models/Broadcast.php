<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Broadcast extends Model
{
    protected $fillable = [
        'title', 'body', 'body_html',
        'cta_label', 'cta_url',
        'youtube_url', 'image_path',
        'target_filters',
        'scheduled_at', 'sent_at',
        'push_enabled', 'style',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'target_filters' => 'array',
            'scheduled_at' => 'datetime',
            'sent_at' => 'datetime',
            'push_enabled' => 'boolean',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function views(): HasMany
    {
        return $this->hasMany(BroadcastView::class);
    }

    /** Convenience: has the broadcast been sent yet? */
    public function isSent(): bool
    {
        return $this->sent_at !== null;
    }

    /** Youtube video id extracted from the stored URL, or null. */
    public function youtubeId(): ?string
    {
        if (!$this->youtube_url) return null;
        preg_match('%(?:youtube\.com/(?:watch\?v=|embed/|shorts/)|youtu\.be/)([A-Za-z0-9_-]{11})%', $this->youtube_url, $m);
        return $m[1] ?? null;
    }
}
