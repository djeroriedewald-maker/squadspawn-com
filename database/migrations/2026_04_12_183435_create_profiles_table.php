<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('username')->unique();
            $table->string('avatar')->nullable();
            $table->text('bio')->nullable();
            $table->enum('looking_for', ['casual', 'ranked', 'friends', 'any'])->default('any');
            $table->string('region')->nullable();
            $table->string('timezone')->nullable();
            $table->json('available_times')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
