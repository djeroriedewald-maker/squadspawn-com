<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('broadcasts', function (Blueprint $table) {
            // How many targeted users had at least one push subscription.
            // Split from the users-count so admins can see "targeted 40,
            // only 12 had push enabled" at a glance after dispatch.
            $table->unsignedInteger('push_eligible_count')->nullable()->after('push_enabled');
            $table->unsignedInteger('push_sent_count')->nullable()->after('push_eligible_count');
        });
    }

    public function down(): void
    {
        Schema::table('broadcasts', function (Blueprint $table) {
            $table->dropColumn(['push_eligible_count', 'push_sent_count']);
        });
    }
};
