<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->decimal('reputation_score', 3, 1)->default(0)->after('is_live');
            $table->integer('achievement_points')->default(0)->after('reputation_score');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['reputation_score', 'achievement_points']);
        });
    }
};
