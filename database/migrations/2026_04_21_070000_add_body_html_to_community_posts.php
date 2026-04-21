<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('community_posts', function (Blueprint $table) {
            // Rich-text HTML source — produced by Tiptap, sanitised by
            // HTMLPurifier before save. Existing posts keep their markdown
            // body; the model's accessor falls back to the markdown render
            // when this column is null so legacy posts still render.
            $table->longText('body_html')->nullable()->after('body');
        });
    }

    public function down(): void
    {
        Schema::table('community_posts', function (Blueprint $table) {
            $table->dropColumn('body_html');
        });
    }
};
