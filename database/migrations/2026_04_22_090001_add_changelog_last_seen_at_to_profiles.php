<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            // Used to show the "What's new" dot on the nav until the user
            // opens /changelog. Storing the published_at cutoff of the
            // latest entry they've seen lets us diff against new releases
            // without a separate "read" pivot table.
            $table->timestamp('changelog_last_seen_at')->nullable()->after('theme_preference');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('changelog_last_seen_at');
        });
    }
};
