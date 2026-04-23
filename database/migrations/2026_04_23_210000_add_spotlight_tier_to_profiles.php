<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Prep for future monetisation — a tier label on each creator's
 * spotlight slot. Today everything is 'free' (hand-curated, no cost);
 * when we ship paid promotion the only change needed is rendering a
 * different card for 'promoted' in CreatorSpotlight.tsx. Storage is
 * cheap, the split later is clean.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            // `string` instead of a MySQL enum so the set of tiers can
            // grow without an ALTER TABLE later — app-level validation
            // gates what's actually acceptable.
            $table->string('spotlight_tier', 16)->default('free')->after('featured_until');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('spotlight_tier');
        });
    }
};
