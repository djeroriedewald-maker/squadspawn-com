<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('game_imports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('triggered_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            // Short descriptor of what this run did. "top 500 shooters",
            // "preset", "manual slug=valorant", etc. Shown in the admin UI
            // so the run list is readable at a glance.
            $table->string('label');
            // Serialised artisan args so we can audit exactly what was run.
            $table->json('args');
            $table->enum('status', ['queued', 'running', 'completed', 'failed'])->default('queued');
            $table->unsignedInteger('added')->default(0);
            $table->unsignedInteger('updated')->default(0);
            $table->unsignedInteger('skipped')->default(0);
            $table->unsignedInteger('failed')->default(0);
            $table->text('output')->nullable();
            $table->text('error')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_imports');
    }
};
