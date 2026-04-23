<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The first round of changelog entries leaked implementation detail
 * on security patches (specific bypass payloads, named vulnerability
 * classes, pre-patch attack vectors). Useful for engineers, risky for
 * a public-facing page: someone running a delayed deploy could use
 * those notes as a checklist.
 *
 * This migration rewrites the affected entries in plain user-speak.
 * Runs idempotently: only touches the specific slugs shipped by the
 * initial backfill.
 */
return new class extends Migration {
    public function up(): void
    {
        foreach ($this->replacements() as $slug => $payload) {
            DB::table('changelog_entries')
                ->where('slug', $slug)
                ->update([
                    'title' => $payload['title'],
                    'body' => $payload['body'],
                    'body_html' => $payload['body'],
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        // No-op: we don't want to restore the leaky copy.
    }

    /** @return array<string, array{title: string, body: string}> */
    private function replacements(): array
    {
        return [
            'v1-0-0-security-and-performance' => [
                'title' => 'Under-the-hood security &amp; speed pass',
                'body' => <<<'HTML'
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
HTML,
            ],

            'v1-3-1-google-login-and-delete-account' => [
                'title' => 'Smoother Google login + safer account deletion',
                'body' => <<<'HTML'
<p>Two small follow-ups:</p>
<ul>
  <li><strong>Google login runs smoothly again.</strong> Existing accounts linked via Google sign in without friction.</li>
  <li><strong>Delete-account flow for Google accounts.</strong> Since you never picked a SquadSpawn password, the delete dialog now asks you to type <code>DELETE</code> in capitals to confirm instead.</li>
</ul>
HTML,
            ],
        ];
    }
};
