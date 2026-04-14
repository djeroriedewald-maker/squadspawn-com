<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change tag from enum to string to support multiple comma-separated tags
        \DB::statement("ALTER TABLE lfg_ratings MODIFY tag VARCHAR(255) NULL");
    }

    public function down(): void
    {
        // Cannot safely revert to enum if data has comma-separated values
    }
};
