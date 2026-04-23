<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/**
 * Enforces the rules every public username on SquadSpawn must meet:
 *
 * - ASCII only (A-Z, a-z, 0-9, underscore, hyphen). This deliberately
 *   blocks Cyrillic/Greek/zero-width homographs that would otherwise
 *   let an attacker register `djerо` (Cyrillic о) to impersonate a
 *   high-reputation `djero` (Latin o).
 * - Length 3-32.
 * - Not one of a reserved list of platform/role-ish names.
 * - Case-insensitively unique across the profiles table. The DB-level
 *   unique index still catches exact-case collisions; this adds the
 *   case-folded check that Laravel's `unique` can't express portably.
 */
class ValidUsername implements ValidationRule
{
    /** Names no normal user should be able to claim. */
    private const RESERVED = [
        'admin', 'administrator', 'moderator', 'mod', 'staff', 'support',
        'owner', 'root', 'system', 'null', 'undefined',
        'squadspawn', 'squad', 'squadspawn_official', 'official',
        'help', 'helpdesk', 'info', 'noreply', 'no-reply',
        'bot', 'bots', 'automod', 'operator',
        'me', 'you', 'user', 'users', 'anonymous', 'guest',
    ];

    public function __construct(private readonly ?int $ignoreProfileId = null)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_string($value)) {
            $fail('The :attribute must be a string.');
            return;
        }

        if (!preg_match('/^[A-Za-z0-9_-]{3,32}$/', $value)) {
            $fail('Username must be 3-32 characters using only letters, numbers, underscore, or hyphen.');
            return;
        }

        if (in_array(strtolower($value), self::RESERVED, true)) {
            $fail('That username is reserved. Please pick another one.');
            return;
        }

        $query = DB::table('profiles')
            ->whereRaw('LOWER(username) = ?', [strtolower($value)]);
        if ($this->ignoreProfileId !== null) {
            $query->where('id', '!=', $this->ignoreProfileId);
        }
        if ($query->exists()) {
            $fail('That username is already taken.');
        }
    }
}
