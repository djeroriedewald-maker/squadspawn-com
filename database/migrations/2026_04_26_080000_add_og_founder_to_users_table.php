<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Hand-picked seed users — distinct from the auto-numbered
            // Founding Member status (which is purely id <= FOUNDER_CAP).
            // OG Founders are friends/early supporters Djero personally
            // brought in, get the highest-tier badge + lifetime perks.
            $table->boolean('is_og_founder')->default(false)->after('is_owner');
            $table->timestamp('og_founder_granted_at')->nullable()->after('is_og_founder');
            // Lifetime Plus access. Doesn't gate anything yet (Plus is
            // pre-launch waitlist), but ships now so the admin tool can
            // mark seed users today and the gate auto-applies on launch.
            $table->boolean('plus_lifetime')->default(false)->after('og_founder_granted_at');
            $table->index('is_og_founder');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['is_og_founder']);
            $table->dropColumn(['is_og_founder', 'og_founder_granted_at', 'plus_lifetime']);
        });
    }
};
