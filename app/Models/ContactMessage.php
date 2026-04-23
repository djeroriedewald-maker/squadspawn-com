<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactMessage extends Model
{
    protected $fillable = ['user_id', 'name', 'email', 'subject', 'category', 'body', 'status'];

    public const STATUSES = ['new', 'read', 'replied', 'archived'];
    public const CATEGORIES = [
        'bug' => 'Bug report',
        'feature' => 'Feature request',
        'feedback' => 'General feedback',
        'press' => 'Press / media',
        'partnership' => 'Partnership / brand',
        'creator' => 'Creator Spotlight',
        'privacy' => 'Privacy / GDPR',
        'other' => 'Something else',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
