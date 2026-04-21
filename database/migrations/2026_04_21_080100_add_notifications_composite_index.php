<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // The unread-notification query is polled every few seconds
            // per authenticated user and filters on (notifiable_type,
            // notifiable_id, read_at). The existing index on
            // (notifiable_id, read_at) misses the type, so on a busy
            // table the planner still has to scan rows that belong to
            // other notifiable models. This composite matches the query
            // shape exactly.
            $table->index(
                ['notifiable_type', 'notifiable_id', 'read_at'],
                'notifications_morph_read_idx'
            );
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('notifications_morph_read_idx');
        });
    }
};
