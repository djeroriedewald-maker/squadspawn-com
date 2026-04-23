<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * v1.3.0 was written from the admin's perspective ("admins can now
 * push news and drops"). Swap it for the user's perspective —
 * the same release, but framed as what users get out of it.
 */
return new class extends Migration {
    public function up(): void
    {
        DB::table('changelog_entries')
            ->where('slug', 'v1-3-0-changelog-and-announcements')
            ->update([
                'title' => 'Changelog is live + in-app announcements',
                'body' => $this->body(),
                'body_html' => $this->body(),
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // No-op — never restore the admin-centric copy.
    }

    private function body(): string
    {
        return <<<'HTML'
<p>Two overdue features at once. Both designed to keep you in the loop without feeling like spam.</p>
<p><strong>Changelog</strong> — the page you're reading. Every release we ship lands here as a timeline entry, tagged Feature / Improvement / Fix / Security. A small red dot on the changelog icon in the top-right shows up whenever something's shipped since your last visit. Entries are shareable URLs too, so you can drop a link in Discord.</p>
<p><strong>In-app announcements</strong> — important platform news now surfaces as a popup with an optional call-to-action. Nothing you need to configure; you'll just see them when they're relevant. Miss one? Everything you've received lives at <a href="/announcements">/announcements</a> so nothing gets lost if you dismiss a popup too quickly. You can fine-tune push delivery for these under <a href="/profile">your profile settings → Push notifications → Platform announcements</a>.</p>
<p>Expect this page to get busier as we roll out the next few drops.</p>
HTML;
    }
};
