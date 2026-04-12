<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('passer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('passed_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['passer_id', 'passed_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('passes');
    }
};
