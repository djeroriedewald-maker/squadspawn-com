<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            // Mirror of RAWG's `added` field — count of RAWG users who've put
            // this game on their profile. Best signal we have for global game
            // popularity, drives the default sort on /games. Indexed so the
            // ORDER BY popularity_score DESC scales as the catalogue grows.
            $table->unsignedInteger('popularity_score')->default(0)->after('genre');
            $table->index('popularity_score');
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropIndex(['popularity_score']);
            $table->dropColumn('popularity_score');
        });
    }
};
