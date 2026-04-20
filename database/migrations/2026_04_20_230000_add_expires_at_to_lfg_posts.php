<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->timestamp('expires_at')->nullable()->after('scheduled_at');
            $table->index('expires_at');
        });

        // Backfill: give existing open posts 6h from their creation time.
        // Posts older than that stay expired (so stale content falls out of
        // the feed immediately instead of reappearing).
        DB::table('lfg_posts')
            ->whereNull('expires_at')
            ->update(['expires_at' => DB::raw("DATE_ADD(created_at, INTERVAL 6 HOUR)")]);
    }

    public function down(): void
    {
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->dropIndex(['expires_at']);
            $table->dropColumn('expires_at');
        });
    }
};
