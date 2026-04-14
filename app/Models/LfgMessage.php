<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class LfgMessage extends Model
{
    protected $fillable = ['lfg_post_id', 'user_id', 'body'];

    public function setBodyAttribute(string $value): void
    {
        $this->attributes['body'] = Crypt::encryptString($value);
    }

    public function getBodyAttribute(?string $value): ?string
    {
        if (!$value) return null;

        try {
            return Crypt::decryptString($value);
        } catch (\Illuminate\Contracts\Encryption\DecryptException $e) {
            return $value;
        }
    }

    public function lfgPost(): BelongsTo
    {
        return $this->belongsTo(LfgPost::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
