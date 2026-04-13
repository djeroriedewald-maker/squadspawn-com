<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LfgRating extends Model
{
    protected $fillable = ['lfg_post_id', 'rater_id', 'rated_id', 'score', 'tag', 'comment'];

    public function lfgPost(): BelongsTo
    {
        return $this->belongsTo(LfgPost::class);
    }

    public function rater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rater_id');
    }

    public function rated(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rated_id');
    }
}
