<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('broadcasts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body')->nullable();
            $table->text('body_html')->nullable();
            // Optional call-to-action button shown on the popup.
            $table->string('cta_label')->nullable();
            $table->string('cta_url')->nullable();
            // YouTube embed support only — no self-hosted video to keep
            // storage costs predictable.
            $table->string('youtube_url')->nullable();
            // Hero image shown above the title inside the popup.
            $table->string('image_path')->nullable();
            // Targeting filters as JSON — {game_ids?: int[], regions?:
            // string[], min_level?: int}. Empty / null = everyone.
            $table->json('target_filters')->nullable();
            // Optional scheduled send (dispatcher picks it up).
            $table->timestamp('scheduled_at')->nullable()->index();
            // Set once the broadcast has been sent (push + delivery rows
            // materialised) so we never double-send.
            $table->timestamp('sent_at')->nullable();
            $table->boolean('push_enabled')->default(true);
            $table->enum('style', ['popup', 'banner'])->default('popup');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });

        Schema::create('broadcast_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('broadcast_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamp('clicked_at')->nullable();
            $table->timestamps();

            // One delivery row per (broadcast, user) pair — dashboard
            // uses this both to suppress the popup and to compute stats.
            $table->unique(['broadcast_id', 'user_id']);
            $table->index(['user_id', 'dismissed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('broadcast_views');
        Schema::dropIfExists('broadcasts');
    }
};
