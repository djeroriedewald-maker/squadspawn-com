<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            // Storage path for phase-2 user-uploaded banners. Distinct from
            // banner_preset so switching styles back and forth preserves
            // the uploaded file until the user explicitly deletes it.
            $table->string('banner_upload_path')->nullable()->after('banner_preset');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn('banner_upload_path');
        });
    }
};
