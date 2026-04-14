<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Critical: UUID index for chat route model binding
        if (!$this->hasIndex('matches', 'matches_uuid_index')) {
            Schema::table('matches', function (Blueprint $table) {
                $table->index('uuid');
            });
        }

        // Composite indexes for message queries (last message + unread count)
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['match_id', 'created_at']);
        });

        // Likes: prevent duplicates + fast lookups
        if (!$this->hasIndex('likes', 'likes_liker_id_liked_id_unique')) {
            Schema::table('likes', function (Blueprint $table) {
                $table->unique(['liker_id', 'liked_id']);
            });
        }

        // User games composite for discovery scoring
        Schema::table('user_games', function (Blueprint $table) {
            $table->index(['user_id', 'game_id']);
        });

        // Soft deletes on users for data recovery
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });

        // Ban tracking
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_banned')->default(false);
            $table->timestamp('banned_at')->nullable();
            $table->string('ban_reason')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropIndex(['uuid']);
        });
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['match_id', 'created_at']);
        });
        Schema::table('user_games', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'game_id']);
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['is_banned', 'banned_at', 'ban_reason']);
        });
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(Schema::getIndexes($table))->contains(fn ($idx) => $idx['name'] === $indexName);
    }
};
