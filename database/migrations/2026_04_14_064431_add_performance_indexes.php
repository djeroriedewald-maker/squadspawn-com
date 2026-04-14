<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Users - "online now" queries
        Schema::table('users', function (Blueprint $table) {
            $table->index('updated_at');
        });

        // Messages - unread count queries
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['match_id', 'read_at']);
            $table->index('sender_id');
        });

        // LFG - status filtering
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->index('status');
            $table->index('user_id');
            $table->index(['game_id', 'status']);
        });

        // LFG responses - accepted count
        Schema::table('lfg_responses', function (Blueprint $table) {
            $table->index(['lfg_post_id', 'status']);
        });

        // LFG messages
        Schema::table('lfg_messages', function (Blueprint $table) {
            $table->index('lfg_post_id');
        });

        // Likes - both directions
        Schema::table('likes', function (Blueprint $table) {
            $table->index('liked_id');
        });

        // Passes
        Schema::table('passes', function (Blueprint $table) {
            $table->index('passer_id');
        });

        // Blocks - both directions
        Schema::table('blocks', function (Blueprint $table) {
            $table->index('blocked_id');
        });

        // User games - trending queries
        Schema::table('user_games', function (Blueprint $table) {
            $table->index('created_at');
        });

        // Profiles - search
        Schema::table('profiles', function (Blueprint $table) {
            $table->index('username');
            $table->index('region');
        });

        // Community posts
        Schema::table('community_posts', function (Blueprint $table) {
            $table->index('user_id');
            $table->index('game_id');
            $table->index('type');
        });

        // Post comments
        Schema::table('post_comments', function (Blueprint $table) {
            $table->index('community_post_id');
        });

        // Post votes
        Schema::table('post_votes', function (Blueprint $table) {
            $table->index('community_post_id');
        });

        // LFG ratings
        Schema::table('lfg_ratings', function (Blueprint $table) {
            $table->index('rated_id');
        });

        // User achievements
        Schema::table('user_achievements', function (Blueprint $table) {
            $table->index('user_id');
        });

        // Clips
        Schema::table('clips', function (Blueprint $table) {
            $table->index('user_id');
        });

        // Notifications
        Schema::table('notifications', function (Blueprint $table) {
            $table->index(['notifiable_id', 'read_at']);
        });
    }

    public function down(): void
    {
        // Indexes are automatically dropped when tables are dropped
        // For individual removal, each would need dropIndex()
    }
};
