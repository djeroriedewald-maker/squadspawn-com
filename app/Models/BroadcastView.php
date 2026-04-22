<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BroadcastView extends Model
{
    protected $fillable = [
        'broadcast_id', 'user_id',
        'viewed_at', 'dismissed_at', 'clicked_at',
    ];

    protected function casts(): array
    {
        return [
            'viewed_at' => 'datetime',
            'dismissed_at' => 'datetime',
            'clicked_at' => 'datetime',
        ];
    }

    public function broadcast(): BelongsTo
    {
        return $this->belongsTo(Broadcast::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
