<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seed the v1.5.0 changelog entry — pre-launch hardening sweep shipped
 * on 2026-04-23 ahead of the Reddit promotion push. Same idempotent
 * pattern as earlier backfills: skip if the slug already exists,
 * attribute to the first owner/admin at runtime.
 */
return new class extends Migration {
    public function up(): void
    {
        $authorId = DB::table('users')->where('is_owner', true)->value('id')
            ?? DB::table('users')->where('is_admin', true)->value('id')
            ?? DB::table('users')->orderBy('id')->value('id');

        if (!$authorId) return;

        foreach ($this->entries() as $entry) {
            $exists = DB::table('changelog_entries')->where('slug', $entry['slug'])->exists();
            if ($exists) continue;

            DB::table('changelog_entries')->insert(array_merge($entry, [
                'user_id' => $authorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        DB::table('cache')->where('key', 'like', '%changelog:latest_published_at%')->delete();
    }

    public function down(): void
    {
        DB::table('changelog_entries')
            ->whereIn('slug', array_column($this->entries(), 'slug'))
            ->delete();
    }

    /** @return array<int, array<string, mixed>> */
    private function entries(): array
    {
        return [
            [
                'version' => '1.5.0',
                'slug' => 'v1-5-0-launch-hardening',
                'title' => 'Pre-launch hardening — privacy, safety and reliability pass',
                'tag' => 'security',
                'is_highlight' => true,
                'published_at' => '2026-04-23 17:00:00',
                'body' => $this->b150(),
                'body_html' => $this->b150(),
            ],
        ];
    }

    private function b150(): string
    {
        return <<<'HTML'
<p>A broad hardening sweep ahead of our next growth push. Nothing visible is changing in the feed, but a lot of what happens behind the scenes now behaves more like you'd want it to.</p>

<p><strong>Your data stays yours.</strong> Public profile pages and discovery no longer ship fields like your e-mail, date of birth or referral code along with your username &mdash; only the stuff that was always meant to be public (username, avatar, bio, games, region, reputation) is sent to visitors.</p>

<p><strong>Safer sign-ups.</strong> Registration, login, password-reset and Google sign-in are now rate-limited, so automated sign-up bots can't hammer the door. The platform now also only accepts accounts aged 16 and over at sign-up &mdash; the self-checked parental-consent option was removed in favour of a clean legal floor. Google sign-ups are routed through the age-verification screen before they can touch community features.</p>

<p><strong>Block actually blocks.</strong> Blocking someone now also cuts off direct messages and LFG group chat with them &mdash; previously the block only hid them in discovery. Friendships and group memberships stay intact, only the message channel is severed.</p>

<p><strong>Usernames got stricter.</strong> Only letters, digits, underscore and hyphen are allowed. Cyrillic / Greek / zero-width look-alikes are rejected, which kills a class of impersonation attacks (one account pretending to be another by mixing similar-looking letters). Usernames are also unique regardless of upper/lower case, and a reserved list prevents claiming names like "admin" or "squadspawn".</p>

<p><strong>Reports can't be weaponised.</strong> One report per user-against-user per day, plus a daily cap per reporter, so someone can't spam-report a rival and flood the moderation queue.</p>

<p><strong>Referrals reward real sign-ups.</strong> The "invites landed" counter now only counts people who actually finished their profile &mdash; so nobody can mint throwaway accounts to inflate their own invite count. The auto-friendship between inviter and invitee still happens, just at profile completion instead of first click.</p>

<p><strong>Reliability and speed.</strong> All notifications now process asynchronously, so a slow Google/Mozilla push endpoint can't stall a request that's trying to serve you. Added indexes on the chat + discovery hot-paths. Heavy info-level logging on the chat flow was removed. The dashboard "rate your teammates" funnel no longer misses sessions for power users.</p>

<p><strong>For admins.</strong> Every ban, unban, role change, impersonation, kill-switch, changelog edit, broadcast send, LFG deletion and game CRUD is now recorded in an immutable audit log. Banning or kill-switching a user now also evicts every active session of theirs in the same breath. "Unban" is a real button now instead of only a promise.</p>

<p><strong>Privacy documents.</strong> Privacy policy now explicitly lists every sub-processor (Google OAuth, Steam Web API, RAWG, Plausible Analytics, Web Push, hosting) with what each one sees. Cookie policy no longer mentions Google Analytics cookies &mdash; we've always used Plausible (cookie-less), the old wording was inaccurate. Retention schedules (sessions, notifications, resolved reports, audit log) are now enforced by a nightly job, not just promised.</p>

<p>These changes are cumulative. Thanks for the patience on the quieter week while we did this &mdash; back to shipping features now.</p>
HTML;
    }
};
