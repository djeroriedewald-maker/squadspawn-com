<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creator Spotlight: a moderator-controlled window during which a
 * creator's profile + clips get featured on the homepage + dashboard.
 * Null = not featured. A future date = featured until that moment. A
 * past date = expired (query filters it out).
 *
 * Chose a timestamp over a boolean so slots auto-expire without a cron
 * job; if a creator stops producing content their spotlight simply runs
 * out and has to be renewed, which gives us a natural filter against
 * dead slots.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->timestamp('featured_until')->nullable()->after('is_creator');
            $table->index(['featured_until'], 'profiles_featured_until_index');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropIndex('profiles_featured_until_index');
            $table->dropColumn('featured_until');
        });
    }
};
