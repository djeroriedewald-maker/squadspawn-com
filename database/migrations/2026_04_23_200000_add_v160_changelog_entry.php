<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seed the v1.6.0 changelog entry — Creator Spotlight launch on
 * 2026-04-23. Same idempotent pattern as earlier backfills: skip
 * if the slug already exists, attribute to the first owner/admin
 * at runtime.
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
                'version' => '1.6.0',
                'slug' => 'v1-6-0-creator-spotlight',
                'title' => 'Creator Spotlight — streamers + content creators in the feed',
                'tag' => 'feature',
                'is_highlight' => true,
                'published_at' => '2026-04-23 20:00:00',
                'body' => $this->b160(),
                'body_html' => $this->b160(),
            ],
        ];
    }

    private function b160(): string
    {
        return <<<'HTML'
<p>We're turning the Clips section into something worth opening — a dedicated surface for the streamers and content creators already in the community.</p>

<p><strong>Creators renamed, repurposed.</strong> The page previously called "Clips" is now <a href="/clips">Creators</a>. Same URL, new job: discover the streamers and content creators building their audience on SquadSpawn, then scroll down into the full clip feed underneath.</p>

<p><strong>Creator Spotlight on the homepage + dashboard.</strong> A hand-curated strip of featured creators shows up on <a href="/">the homepage</a> and everyone's <a href="/dashboard">dashboard</a> — with a top clip, their games, reputation, and quick links to their Twitch / YouTube / TikTok. We pick who gets featured, slots run 1-90 days, and then auto-expire so the strip stays fresh.</p>

<p><strong>Creator profile hero.</strong> If someone is marked as a creator on their profile, their page now opens with a big top-clip showcase and their socials as prominent chips, instead of hiding clips at the bottom. A streamer sharing <code>squadspawn.com/player/their-name</code> on Twitch finally lands viewers on their content first.</p>

<p><strong>Early access is free.</strong> Spotlight featuring is free for all verified creators while we grow the community &mdash; treat it as a founding-creator perk. Paid promoted slots will arrive later, alongside this curated tier, once there's an audience worth promoting to.</p>

<p><strong>How to get featured:</strong></p>
<ol>
  <li>Turn on the <em>I'm a content creator</em> toggle in <a href="/profile/setup">Profile setup</a>.</li>
  <li>Share at least one clip via the <a href="/clips">Creators</a> page &mdash; YouTube video, Twitch clip, or TikTok link.</li>
  <li>Drop us a line at <a href="mailto:info@squadspawn.com">info@squadspawn.com</a> and we'll consider you for the next rotation.</li>
</ol>

<p>If you run a gaming channel, small stream, or just upload occasional highlights &mdash; this is the moment to claim your corner.</p>
HTML;
    }
};
