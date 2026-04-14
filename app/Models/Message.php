<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class Message extends Model
{
    protected $fillable = ['match_id', 'sender_id', 'body', 'read_at'];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    // Encrypt message body when saving
    public function setBodyAttribute(string $value): void
    {
        $this->attributes['body'] = Crypt::encryptString($value);
    }

    // Decrypt message body when reading
    public function getBodyAttribute(?string $value): ?string
    {
        if (!$value) return null;

        try {
            return Crypt::decryptString($value);
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            // Return raw value if not encrypted (old messages)
            return $value;
        }
    }

    public function match(): BelongsTo
    {
        return $this->belongsTo(PlayerMatch::class, 'match_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
