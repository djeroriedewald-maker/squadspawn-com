<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('changelog_entries', function (Blueprint $table) {
            $table->id();
            $table->string('version', 32)->index();         // e.g. 1.4.2
            $table->string('slug')->unique();               // URL segment
            $table->string('title');
            $table->text('body')->nullable();               // Tiptap source
            $table->text('body_html')->nullable();          // sanitised render
            $table->enum('tag', ['feature', 'improvement', 'fix', 'security']);
            $table->boolean('is_highlight')->default(false); // shows as hero card
            $table->timestamp('published_at')->nullable()->index();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('changelog_entries');
    }
};
