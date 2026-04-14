<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LfgMessage extends Model
{
    protected $fillable = ['lfg_post_id', 'user_id', 'body'];

    public function lfgPost(): BelongsTo
    {
        return $this->belongsTo(LfgPost::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
