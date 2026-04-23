<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * New users can upload an avatar (or pick a preset) during profile
 * setup before they've saved a username. The avatar endpoint does
 * an `updateOrCreate` on profiles; if the row doesn't exist yet
 * that INSERT fails on the NOT NULL username column.
 *
 * Making username nullable lets us create the profile row early
 * (avatar, banner, etc.) while EnsureProfileComplete middleware
 * still keeps LFG/Discovery gated until the user picks a username.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('username')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->string('username')->nullable(false)->change();
        });
    }
};
