<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('moderation_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('moderator_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 32); // hide_post, unhide_post, lock_post, unlock_post, pin_post, unpin_post, hide_comment, unhide_comment
            $table->string('target_type', 32); // 'community_post' | 'post_comment'
            $table->unsignedBigInteger('target_id');
            $table->string('reason', 500)->nullable();
            $table->timestamps();

            $table->index(['target_type', 'target_id']);
            $table->index('moderator_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moderation_actions');
    }
};
