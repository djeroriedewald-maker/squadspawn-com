<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlusWaitlistEntry extends Model
{
    protected $table = 'plus_waitlist';
    public $timestamps = false;

    protected $fillable = ['user_id', 'email', 'note', 'created_at'];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
