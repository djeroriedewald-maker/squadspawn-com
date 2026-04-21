<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->timestamp('hidden_at')->nullable()->after('status');
            $table->foreignId('hidden_by_user_id')->nullable()->after('hidden_at')
                ->constrained('users')->nullOnDelete();
            $table->string('hidden_reason')->nullable()->after('hidden_by_user_id');
            $table->index('hidden_at');
        });
    }

    public function down(): void
    {
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hidden_by_user_id');
            $table->dropColumn(['hidden_at', 'hidden_reason']);
        });
    }
};
