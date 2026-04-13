<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lfg_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lfg_post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('rater_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('rated_id')->constrained('users')->cascadeOnDelete();
            $table->tinyInteger('score');
            $table->enum('tag', ['great_teammate', 'good_comms', 'skilled', 'friendly', 'toxic', 'no_show'])->nullable();
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['lfg_post_id', 'rater_id', 'rated_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lfg_ratings');
    }
};
