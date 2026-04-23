<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Let senders pick a category on the contact form so admin can triage
 * by type instead of reading every row. `other` is the safe default
 * for rows inserted before this column existed.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->string('category', 32)->default('other')->after('subject');
            $table->index(['category', 'status'], 'contact_messages_category_status_index');
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropIndex('contact_messages_category_status_index');
            $table->dropColumn('category');
        });
    }
};
