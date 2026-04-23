<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Contact-form inbox. Messages submitted via /contact land here
 * instead of an inbox, so admin can read + triage from /admin/messages.
 *
 * user_id is nullable because the form is public — logged-out visitors
 * should still be able to reach us.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 120);
            $table->string('email');
            $table->string('subject', 200);
            $table->text('body');
            $table->string('status', 16)->default('new'); // new | read | replied | archived
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();

            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
