<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique()->after('title');
        });

        // Generate slugs for existing posts
        DB::table('lfg_posts')->get()->each(function ($post) {
            $base = Str::slug($post->title);
            $slug = $base . '-' . $post->id;
            DB::table('lfg_posts')->where('id', $post->id)->update(['slug' => $slug]);
        });
    }

    public function down(): void
    {
        Schema::table('lfg_posts', function (Blueprint $table) {
            $table->dropColumn('slug');
        });
    }
};
