<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Follow-up to 2026_04_23_080000_soften_changelog_entries. The v1.5.0
 * hardening entry as originally written described the pre-patch attack
 * surface in enough detail to read as a vulnerability checklist
 * ("named PII fields leaked", "impersonation attack class",
 * "throwaway accounts could farm", "previously the block only hid in
 * discovery", "sessions not evicted on ban"). Shifts to user-speak —
 * what's true now, not what was true before.
 */
return new class extends Migration {
    public function up(): void
    {
        DB::table('changelog_entries')
            ->where('slug', 'v1-5-0-launch-hardening')
            ->update([
                'title' => 'Pre-launch polish &mdash; privacy, safety and reliability',
                'body' => $this->body(),
                'body_html' => $this->body(),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // No-op. Not restoring the leakier copy.
    }

    private function body(): string
    {
        return <<<'HTML'
<p>A broad polish pass across privacy, safety and reliability ahead of our next growth push. Nothing visible is changing in the feed &mdash; everything just runs a bit tighter.</p>

<p><strong>Stronger privacy by default.</strong> Profile pages only show the fields you'd expect to be public (username, avatar, bio, games, region, reputation). Everything else stays between you and SquadSpawn.</p>

<p><strong>Safer sign-ups.</strong> Registration, login, password-reset and Google sign-in run through stricter guards against automated abuse. The platform now only accepts accounts aged 16 and over &mdash; Google sign-ups go through age verification before they can reach community features.</p>

<p><strong>Block now fully cuts off contact.</strong> Blocking someone stops direct messages and LFG group chat with them, not just Discover visibility. Friendships and group memberships stay intact &mdash; only the message channel is severed.</p>

<p><strong>Usernames are uniquer.</strong> Stricter character rules prevent look-alike impersonation and reserved platform names (admin, support, etc.).</p>

<p><strong>Report system is better behaved.</strong> Sensible per-reporter and per-target limits keep the moderation queue clean.</p>

<p><strong>Referrals reward real accounts.</strong> "Invites landed" only counts people who actually finished their profile. The automatic friendship between inviter and invitee kicks in at that same moment too.</p>

<p><strong>Reliability + speed.</strong> Notifications now process asynchronously, database paths are better indexed, and the "rate your teammates" prompt no longer misses older sessions.</p>

<p><strong>For admins.</strong> Ban / unban / role change / impersonation / content-removal actions are all recorded in an immutable audit log. Taking an account offline also ends its active sessions in one step. "Unban" is a proper button now.</p>

<p><strong>Privacy documents.</strong> Privacy and cookie policies now accurately describe our sub-processors and analytics setup (cookie-less via Plausible). Retention schedules are enforced nightly.</p>

<p>Thanks for the patience on the quieter week &mdash; back to shipping features.</p>
HTML;
    }
};
