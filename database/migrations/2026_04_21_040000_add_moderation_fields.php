<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_moderator')->default(false)->after('is_admin');
        });

        Schema::table('community_posts', function (Blueprint $table) {
            $table->timestamp('hidden_at')->nullable()->after('comments_count');
            $table->foreignId('hidden_by_user_id')->nullable()->after('hidden_at')
                ->constrained('users')->nullOnDelete();
            $table->string('hidden_reason')->nullable()->after('hidden_by_user_id');
            $table->timestamp('locked_at')->nullable()->after('hidden_reason');
            $table->timestamp('pinned_at')->nullable()->after('locked_at');
            $table->index('pinned_at');
            $table->index('hidden_at');
        });

        Schema::table('post_comments', function (Blueprint $table) {
            $table->timestamp('hidden_at')->nullable()->after('body');
            $table->foreignId('hidden_by_user_id')->nullable()->after('hidden_at')
                ->constrained('users')->nullOnDelete();
            $table->string('hidden_reason')->nullable()->after('hidden_by_user_id');
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->foreignId('community_post_id')->nullable()->after('lfg_post_id')
                ->constrained('community_posts')->nullOnDelete();
            $table->foreignId('post_comment_id')->nullable()->after('community_post_id')
                ->constrained('post_comments')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('is_moderator'));

        Schema::table('community_posts', function (Blueprint $t) {
            $t->dropConstrainedForeignId('hidden_by_user_id');
            $t->dropColumn(['hidden_at', 'hidden_reason', 'locked_at', 'pinned_at']);
        });

        Schema::table('post_comments', function (Blueprint $t) {
            $t->dropConstrainedForeignId('hidden_by_user_id');
            $t->dropColumn(['hidden_at', 'hidden_reason']);
        });

        Schema::table('reports', function (Blueprint $t) {
            $t->dropConstrainedForeignId('community_post_id');
            $t->dropConstrainedForeignId('post_comment_id');
        });
    }
};
