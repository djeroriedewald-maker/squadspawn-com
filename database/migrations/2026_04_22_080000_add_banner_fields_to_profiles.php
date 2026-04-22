<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            // 'game' = auto-derive from main game cover (default, existing
            // behaviour); 'preset' = use one of the named gradients below;
            // 'upload' reserved for phase 2.
            $table->string('banner_style', 16)->default('game')->after('avatar');
            $table->string('banner_preset', 32)->nullable()->after('banner_style');
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['banner_style', 'banner_preset']);
        });
    }
};
