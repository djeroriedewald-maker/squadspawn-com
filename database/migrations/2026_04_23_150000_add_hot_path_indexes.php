<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add indexes to hot-path columns the audit flagged:
 *
 *   - matches.user_two_id: the matches table only had a composite
 *     unique on (user_one_id, user_two_id) which only serves
 *     user_one_id-prefixed queries. Every chat-friends lookup,
 *     discovery match-exclusion, and LFG isFriend check touches
 *     user_two_id with a WHERE clause too — that scans the table
 *     without this index.
 *
 *   - blocks.blocker_id: only `blocked_id` was indexed. Every LFG
 *     index + discovery excludes-by-blocker path does a
 *     `where blocker_id = ?` that scans today.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->index('user_two_id', 'matches_user_two_id_index');
        });

        Schema::table('blocks', function (Blueprint $table) {
            $table->index('blocker_id', 'blocks_blocker_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropIndex('matches_user_two_id_index');
        });

        Schema::table('blocks', function (Blueprint $table) {
            $table->dropIndex('blocks_blocker_id_index');
        });
    }
};
