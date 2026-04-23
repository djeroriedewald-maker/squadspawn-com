<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Waitlist for a future SquadSpawn Plus tier. Collects email + optional
 * "what would you pay for?" note — pure demand-signal data we can look
 * at before deciding what (or whether) to build.
 *
 * user_id is nullable so logged-out homepage visitors can sign up too.
 * email is unique so the same person can't spam-sign up.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('plus_waitlist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('email')->unique();
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plus_waitlist');
    }
};
