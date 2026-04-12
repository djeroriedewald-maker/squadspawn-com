<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Like extends Model
{
    protected $fillable = ['liker_id', 'liked_id'];

    public function liker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'liker_id');
    }

    public function liked(): BelongsTo
    {
        return $this->belongsTo(User::class, 'liked_id');
    }
}
