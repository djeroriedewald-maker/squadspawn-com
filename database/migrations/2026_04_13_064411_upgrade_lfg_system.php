<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->boolean('mic_required')->default(false)->after('rank_min');
            $table->string('language')->nullable()->after('mic_required');
            $table->string('age_requirement')->nullable()->after('language');
            $table->text('requirements_note')->nullable()->after('age_requirement');
        });

        Schema::table('lfg_responses', function (Blueprint $table) {
            // status already has pending/accepted/rejected
        });
    }

    public function down(): void
    {
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->dropColumn(['mic_required', 'language', 'age_requirement', 'requirements_note']);
        });
    }
};
