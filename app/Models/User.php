<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'date_of_birth', 'parental_consent', 'parental_consent_at', 'is_admin', 'is_moderator', 'is_owner', 'is_banned', 'banned_at', 'ban_reason', 'notification_preferences', 'referral_code', 'referred_by_user_id', 'referral_rewarded_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Push notification types users can opt out of individually.
     */
    public const PUSH_TYPES = ['new_message', 'new_match', 'lfg_request', 'lfg_accepted', 'favorite_host_lfg', 'squad_invite', 'role_change'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'notification_preferences' => 'array',
            'referral_rewarded_at' => 'datetime',
            'is_admin' => 'boolean',
            'is_moderator' => 'boolean',
            'is_owner' => 'boolean',
            'is_banned' => 'boolean',
        ];
    }

    /** True if the viewer can use community moderation tools. */
    public function canModerate(): bool
    {
        return (bool) ($this->is_admin || $this->is_moderator);
    }

    /**
     * Owners are untouchable by any other admin. Only a DB migration or
     * direct query can modify an owner account's role, ban status, etc.
     * There is intentionally no endpoint to set or unset is_owner.
     */
    public function isOwner(): bool
    {
        return (bool) $this->is_owner;
    }

    /**
     * Auto-assign a unique referral code on creation.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (blank($user->referral_code)) {
                $user->referral_code = static::generateUniqueReferralCode();
            }
        });
    }

    public static function generateUniqueReferralCode(): string
    {
        do {
            $code = strtoupper(\Illuminate\Support\Str::random(8));
        } while (static::where('referral_code', $code)->exists());
        return $code;
    }

    public function referredBy()
    {
        return $this->belongsTo(User::class, 'referred_by_user_id');
    }

    public function referrals()
    {
        return $this->hasMany(User::class, 'referred_by_user_id');
    }

    /**
     * Whether this user wants to receive push notifications of the given
     * type. Defaults to true — users opt out, not in.
     */
    public function wantsPush(string $type): bool
    {
        $prefs = $this->notification_preferences ?? [];
        $push = $prefs['push'] ?? [];
        return !array_key_exists($type, $push) ? true : (bool) $push[$type];
    }

    public function profile(): HasOne
    {
        return $this->hasOne(Profile::class);
    }

    public function games(): BelongsToMany
    {
        return $this->belongsToMany(Game::class, 'user_games')
            ->withPivot('rank', 'role', 'platform')
            ->withTimestamps();
    }

    public function likedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'likes', 'liker_id', 'liked_id')
            ->withTimestamps();
    }

    public function likedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'likes', 'liked_id', 'liker_id')
            ->withTimestamps();
    }

    public function matches()
    {
        return PlayerMatch::where('user_one_id', $this->id)
            ->orWhere('user_two_id', $this->id);
    }

    /** Hosts this user has explicitly marked as a favourite. */
    public function favoriteHosts(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorite_hosts', 'user_id', 'host_id')
            ->withTimestamps();
    }

    /** Users that have added THIS user as a favourite host. */
    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorite_hosts', 'host_id', 'user_id')
            ->withTimestamps();
    }

    public function clips()
    {
        return $this->hasMany(Clip::class);
    }

    public function communityPosts()
    {
        return $this->hasMany(CommunityPost::class);
    }

    public function achievements(): BelongsToMany
    {
        return $this->belongsToMany(Achievement::class, 'user_achievements')
            ->withTimestamps();
    }

    public function pushSubscriptions()
    {
        return $this->hasMany(PushSubscription::class);
    }
}
