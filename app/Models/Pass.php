<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pass extends Model
{
    protected $fillable = ['passer_id', 'passed_id'];

    public function passer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'passer_id');
    }

    public function passed(): BelongsTo
    {
        return $this->belongsTo(User::class, 'passed_id');
    }
}
