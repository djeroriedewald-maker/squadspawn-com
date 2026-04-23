<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    public const SPOTLIGHT_TIER_FREE = 'free';
    public const SPOTLIGHT_TIER_PROMOTED = 'promoted';
    public const SPOTLIGHT_TIERS = [self::SPOTLIGHT_TIER_FREE, self::SPOTLIGHT_TIER_PROMOTED];

    protected $fillable = [
        'user_id', 'username', 'avatar',
        'banner_style', 'banner_preset', 'banner_upload_path',
        'bio', 'looking_for',
        'region', 'timezone', 'available_times', 'socials',
        'is_creator', 'stream_url', 'is_live', 'has_mic',
        'featured_until', 'spotlight_tier',
        'reputation_score', 'achievement_points',
        'theme_preference',
    ];

    protected function casts(): array
    {
        return [
            'available_times' => 'array',
            'socials' => 'array',
            'is_creator' => 'boolean',
            'is_live' => 'boolean',
            'has_mic' => 'boolean',
            'featured_until' => 'datetime',
        ];
    }

    /** True iff this profile is currently inside an active spotlight window. */
    public function isFeatured(): bool
    {
        return (bool) $this->is_creator
            && $this->featured_until !== null
            && $this->featured_until->isFuture();
    }

    /** True iff this profile is in a paid-promoted slot (not just free spotlight). */
    public function isPromoted(): bool
    {
        return $this->isFeatured() && $this->spotlight_tier === self::SPOTLIGHT_TIER_PROMOTED;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
