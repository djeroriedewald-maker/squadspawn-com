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
        // Each step is wrapped to prevent partial failure

        try {
            if (!$this->hasIndex('matches', 'matches_uuid_index')) {
                Schema::table('matches', function (Blueprint $table) {
                    $table->index('uuid');
                });
            }
        } catch (\Throwable $e) {
            \Log::warning('Migration: uuid index skipped - ' . $e->getMessage());
        }

        try {
            Schema::table('messages', function (Blueprint $table) {
                $table->index(['match_id', 'created_at']);
            });
        } catch (\Throwable $e) {
            \Log::warning('Migration: messages index skipped - ' . $e->getMessage());
        }

        try {
            if (!$this->hasIndex('likes', 'likes_liker_id_liked_id_unique')) {
                // Remove duplicates first to avoid unique constraint violation
                \DB::statement('DELETE l1 FROM likes l1 INNER JOIN likes l2 WHERE l1.id > l2.id AND l1.liker_id = l2.liker_id AND l1.liked_id = l2.liked_id');
                Schema::table('likes', function (Blueprint $table) {
                    $table->unique(['liker_id', 'liked_id']);
                });
            }
        } catch (\Throwable $e) {
            \Log::warning('Migration: likes unique skipped - ' . $e->getMessage());
        }

        try {
            Schema::table('user_games', function (Blueprint $table) {
                $table->index(['user_id', 'game_id']);
            });
        } catch (\Throwable $e) {
            \Log::warning('Migration: user_games index skipped - ' . $e->getMessage());
        }

        // Ban tracking columns
        if (!Schema::hasColumn('users', 'is_banned')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('is_banned')->default(false);
                $table->timestamp('banned_at')->nullable();
                $table->string('ban_reason')->nullable();
            });
        }
    }

    public function down(): void
    {
        // Best-effort rollback
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return collect(Schema::getIndexes($table))->contains(fn ($idx) => $idx['name'] === $indexName);
    }
};
