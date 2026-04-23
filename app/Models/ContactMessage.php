<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactMessage extends Model
{
    protected $fillable = ['user_id', 'name', 'email', 'subject', 'body', 'status'];

    public const STATUSES = ['new', 'read', 'replied', 'archived'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
