<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seed the v1.4.0 changelog entry — invite flow overhaul plus the
 * reputation-aware discovery ranking shipped on 2026-04-23. Same
 * idempotent pattern as the April 21/22 backfill: skip if the slug
 * already exists, attribute to the first owner/admin at runtime.
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
                'version' => '1.4.0',
                'slug' => 'v1-4-0-invites-and-smarter-discover',
                'title' => 'Invites actually connect you + smarter Discover',
                'tag' => 'feature',
                'is_highlight' => true,
                'published_at' => '2026-04-23 13:00:00',
                'body' => $this->b140(),
                'body_html' => $this->b140(),
            ],
        ];
    }

    private function b140(): string
    {
        return <<<'HTML'
<p>A batch of upgrades to the "make friends" side of SquadSpawn — plus a bug hunt in the invite flow.</p>
<p><strong>Invite friends now actually connects you.</strong> When someone signs up through your invite link, you're automatically added as friends and drop straight into each other's chat list — no extra swiping needed. Works whether they sign up with email or one-click via Google.</p>
<p><strong>Invite friends tab on mobile.</strong> The link now lives in the mobile navigation menu too. Previously it was only reachable from the desktop dropdown.</p>
<p><strong>Discover stops showing existing friends.</strong> People you're already matched with — via the swipe feed or an invite link — won't reappear in Discover.</p>
<p><strong>Reputation counts in Discover.</strong> Proven good teammates (4.5&#9733; and up) surface higher in your feed, and players with a consistently negative track record get demoted. New players without ratings yet stay neutral so they get a fair shot.</p>
<p><strong>Cleaner welcome for new members.</strong> After finishing profile setup you now land on your dashboard instead of the swipe feed — giving you a chance to see your first friend (if you were invited), your stats and your games before diving in.</p>
<p><strong>Fix:</strong> the X and Email share buttons on the Invite page were barely readable in dark mode. Both colours are now locked to stay legible in either theme.</p>
HTML;
    }
};
