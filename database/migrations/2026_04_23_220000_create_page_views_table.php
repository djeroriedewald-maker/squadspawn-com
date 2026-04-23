<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Native pageview tracker. One row per tracked GET request — no IPs,
 * user-agents or raw PII kept; only a hashed (one-way) visitor id so
 * we can count distinct visitors without being able to identify them.
 *
 * Pruned to last 90 days by the prune:retention command, matching the
 * rest of our data-retention policy.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('page_views', function (Blueprint $table) {
            $table->id();
            $table->string('path', 255);
            $table->date('day');
            // sha256 of (ip + user_agent + app.key). Stable across a
            // visitor's sessions from the same device, but not
            // reversible to an IP without the app-key salt.
            $table->string('visitor_hash', 64);
            $table->timestamp('created_at')->useCurrent();

            // Hot-path indexes for the admin analytics queries:
            // (day) — totals per window
            // (visitor_hash, day) — distinct-visitor counts per window
            // (day, path) — top-pages per window
            $table->index('day', 'page_views_day_index');
            $table->index(['visitor_hash', 'day'], 'page_views_visitor_day_index');
            $table->index(['day', 'path'], 'page_views_day_path_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_views');
    }
};
