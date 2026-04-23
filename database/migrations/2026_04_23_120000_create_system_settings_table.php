<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('system_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            // Stored as JSON so a single row can hold bool/string/number/
            // array values without gymnastics.
            $table->json('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
