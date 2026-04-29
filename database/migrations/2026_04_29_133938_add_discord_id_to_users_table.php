<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Discord OAuth identity. Same shape as google_id — nullable
            // because most users will sign up via Google or email/password
            // and link Discord later (or never).
            $table->string('discord_id', 32)->nullable()->unique()->after('google_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['discord_id']);
            $table->dropColumn('discord_id');
        });
    }
};
