<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->boolean('is_creator')->default(false)->after('socials');
            $table->string('stream_url')->nullable()->after('is_creator');
            $table->boolean('is_live')->default(false)->after('stream_url');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['is_creator', 'stream_url', 'is_live']);
        });
    }
};
