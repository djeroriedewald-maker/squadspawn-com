<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // Tournament / livestream-watch / giveaway / meetup / training / other.
            // Free-form-ish — controller validates against an allow-list so we
            // can extend later without a migration.
            $table->string('type', 32)->default('other');
            $table->string('title', 100);
            $table->string('slug', 140)->unique();
            // Tiptap output, sanitised through HtmlSanitizer before save.
            $table->longText('body_html')->nullable();
            // Either a host upload (we store the URL) or null — UI then falls
            // back to a stock cover at /images/event_banner.jpg.
            $table->string('cover_image', 500)->nullable();
            // YouTube / Twitch embed for watch parties or trailers.
            $table->string('video_url', 500)->nullable();
            $table->dateTime('scheduled_for');
            $table->dateTime('ends_at')->nullable();
            $table->string('timezone', 50)->default('UTC');
            $table->string('region', 50)->nullable();
            $table->foreignId('game_id')->nullable()->constrained()->nullOnDelete();
            // null = unlimited capacity.
            $table->unsignedInteger('max_capacity')->nullable();
            $table->string('format', 16)->default('solo'); // solo | team
            // External link the host wants attendees to use (Discord, sign-up
            // sheet, stream URL). Validated as a real URL by the controller.
            $table->string('external_link', 500)->nullable();
            // pending_review → published / rejected. cancelled / completed are
            // terminal states the host or system can flip to later.
            $table->string('status', 20)->default('pending_review');
            $table->string('rejected_reason', 500)->nullable();
            // Future paid tier — we'll surface "featured" events on top of the
            // listing. featured_until lets a host buy a finite boost window.
            $table->string('tier', 16)->default('free'); // free | featured
            $table->dateTime('featured_until')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'scheduled_for']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
