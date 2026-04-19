<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->unsignedBigInteger('rawg_id')->nullable()->unique();
            $table->date('released_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn(['description', 'rawg_id', 'released_at']);
        });
    }
};
