<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill the changelog with every notable release shipped during
 * the April-21/22 sprint. Idempotent — skips any slug that already
 * exists, so re-running a failed deploy is safe.
 *
 * Entries are attributed to the first `is_owner` user (or the first
 * admin) at run-time so we don't hard-code an email here.
 */
return new class extends Migration {
    public function up(): void
    {
        // Resolve an author that survives across environments.
        $authorId = DB::table('users')->where('is_owner', true)->value('id')
            ?? DB::table('users')->where('is_admin', true)->value('id')
            ?? DB::table('users')->orderBy('id')->value('id');

        if (!$authorId) return; // Empty DB — nothing to author.

        foreach ($this->entries() as $entry) {
            // Idempotency: never overwrite an existing entry.
            $exists = DB::table('changelog_entries')->where('slug', $entry['slug'])->exists();
            if ($exists) continue;

            DB::table('changelog_entries')->insert(array_merge($entry, [
                'user_id' => $authorId,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
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
        // Most recent first — the public timeline sorts by published_at
        // descending, so ordering here doesn't matter for display.
        return [
            // ── v1.3.1 — Login + delete-account polish ─────────────
            [
                'version' => '1.3.1',
                'slug' => 'v1-3-1-google-login-and-delete-account',
                'title' => 'Smoother Google login + cleaner account deletion',
                'tag' => 'fix',
                'is_highlight' => false,
                'published_at' => '2026-04-22 14:30:00',
                'body' => $this->b131(),
                'body_html' => $this->b131(),
            ],

            // ── v1.3.0 — Changelog + in-app announcements ──────────
            [
                'version' => '1.3.0',
                'slug' => 'v1-3-0-changelog-and-announcements',
                'title' => 'Changelog is live + in-app announcements',
                'tag' => 'feature',
                'is_highlight' => true,
                'published_at' => '2026-04-22 14:00:00',
                'body' => $this->b130(),
                'body_html' => $this->b130(),
            ],

            // ── v1.2.0 — Profile banners ───────────────────────────
            [
                'version' => '1.2.0',
                'slug' => 'v1-2-0-profile-banners',
                'title' => 'Profile banners — gradients + your own uploads',
                'tag' => 'feature',
                'is_highlight' => true,
                'published_at' => '2026-04-22 11:00:00',
                'body' => $this->b120(),
                'body_html' => $this->b120(),
            ],

            // ── v1.1.1 — Minor polish ──────────────────────────────
            [
                'version' => '1.1.1',
                'slug' => 'v1-1-1-session-time-fix',
                'title' => 'Readable session length + nav tweaks',
                'tag' => 'fix',
                'is_highlight' => false,
                'published_at' => '2026-04-21 22:30:00',
                'body' => $this->b111(),
                'body_html' => $this->b111(),
            ],

            // ── v1.1.0 — Help centre ───────────────────────────────
            [
                'version' => '1.1.0',
                'slug' => 'v1-1-0-help-centre',
                'title' => 'Help centre with search, categories & FAQs',
                'tag' => 'feature',
                'is_highlight' => false,
                'published_at' => '2026-04-21 21:00:00',
                'body' => $this->b110(),
                'body_html' => $this->b110(),
            ],

            // ── v1.0.0 — Security + perf sweep ─────────────────────
            [
                'version' => '1.0.0',
                'slug' => 'v1-0-0-security-and-performance',
                'title' => 'Under-the-hood security & speed pass',
                'tag' => 'security',
                'is_highlight' => false,
                'published_at' => '2026-04-21 19:00:00',
                'body' => $this->b100(),
                'body_html' => $this->b100(),
            ],
        ];
    }

    private function b131(): string
    {
        return <<<'HTML'
<p>Two small follow-ups:</p>
<ul>
  <li><strong>Google login runs smoothly again.</strong> Existing accounts linked via Google sign in without friction.</li>
  <li><strong>Delete-account flow for Google accounts.</strong> Since you never picked a SquadSpawn password, the delete dialog now asks you to type <code>DELETE</code> in capitals to confirm instead.</li>
</ul>
HTML;
    }

    private function b130(): string
    {
        return <<<'HTML'
<p>Two overdue features at once. Both designed to keep you in the loop without feeling like spam.</p>
<p><strong>Changelog</strong> — the page you're reading. Every release we ship lands here as a timeline entry, tagged Feature / Improvement / Fix / Security. A small red dot on the changelog icon in the top-right shows up whenever something's shipped since your last visit. Entries are shareable URLs too, so you can drop a link in Discord.</p>
<p><strong>In-app announcements</strong> — important platform news now surfaces as a popup with an optional call-to-action. Nothing you need to configure; you'll just see them when they're relevant. Miss one? Everything you've received lives at <a href="/announcements">/announcements</a> so nothing gets lost if you dismiss a popup too quickly. You can fine-tune push delivery for these under <a href="/profile">your profile settings → Push notifications → Platform announcements</a>.</p>
<p>Expect this page to get busier as we roll out the next few drops.</p>
HTML;
    }

    private function b120(): string
    {
        return <<<'HTML'
<p>The tiny cover-art banner on every profile was due for an upgrade. Two new ways to style your hero.</p>
<p><strong>Eight curated gradients.</strong> Neon Pulse (our signature red), Deep Ocean, Cyber Dawn, Matrix, Midnight, Sunset, Aurora, Monochrome. Pick one in <em>Profile setup → Profile banner</em> — each one is tuned to keep your username readable in both light and dark mode.</p>
<p><strong>Upload your own.</strong> Once you hit <strong>level 2</strong>, a new <em>Upload your own</em> option unlocks. JPG / PNG / WebP, up to 3&nbsp;MB, min 1200×300. We apply a subtle left-side scrim so your photo stays the star while the text on top stays legible.</p>
<p>The default game-cover style has also been polished — cover art is now blurred + darkened on the left so your name actually pops. Your profile hero now matches on the dashboard, your own gaming profile, and your public player page.</p>
HTML;
    }

    private function b111(): string
    {
        return <<<'HTML'
<p>Small but annoying:</p>
<ul>
  <li>The <em>Still playing?</em> nudge on a full LFG used to show "11.363855768055556h". It now renders as a clean <code>hh:mm:ss</code> in monospace.</li>
  <li>Help centre got a dedicated <strong>?</strong> icon in the top nav so you don't have to hunt through the user dropdown.</li>
  <li>Fixed the washed-out gradient on the "Still stuck?" contact card in the help centre — it's dark-with-red-glow in both light and dark theme now.</li>
</ul>
HTML;
    }

    private function b110(): string
    {
        return <<<'HTML'
<p>New page at <a href="/help">/help</a>. Designed to answer the stuff we kept seeing in DMs.</p>
<ul>
  <li><strong>Live search</strong> across every FAQ — filter while you type, popular topics as quick-access chips below the search.</li>
  <li><strong>Six categories</strong>: getting started, LFG &amp; groups, reputation &amp; ratings, friends &amp; discovery, account &amp; integrations, safety &amp; privacy. Click a card to filter the list.</li>
  <li><strong>Deep-links per answer</strong> — hit "copy link" on any FAQ and share the exact question in Discord.</li>
  <li><strong>Guest-friendly</strong>: the page works even without signing in, so you can read everything before registering.</li>
</ul>
<p>If your question isn't in there, hit the <em>Email support</em> button on the page and we'll add it.</p>
HTML;
    }

    private function b100(): string
    {
        return <<<'HTML'
<p>A batch of behind-the-scenes improvements focused on keeping the platform safe and fast. Nothing that changes how you use SquadSpawn — everything just runs a bit tighter.</p>
<p>The highlights:</p>
<ul>
  <li>Account sign-in and account-linking have been hardened.</li>
  <li>User-submitted URLs go through stricter validation end-to-end.</li>
  <li>Rate limits added on account-sensitive endpoints.</li>
  <li>LFG group lists and notification polling are noticeably faster.</li>
  <li>Rich-text editor now lazy-loads — most pages get a lighter bundle.</li>
</ul>
<p>Thanks to <a href="https://budgetpixels.nl" target="_blank" rel="noopener">BudgetPixels.nl</a> for the engineering help.</p>
HTML;
    }
};
