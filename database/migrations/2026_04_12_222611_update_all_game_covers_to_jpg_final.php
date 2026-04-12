<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update all games to use .jpg covers
        DB::table('games')->get()->each(function ($game) {
            if ($game->cover_image && str_ends_with($game->cover_image, '.svg')) {
                DB::table('games')->where('id', $game->id)->update([
                    'cover_image' => str_replace('.svg', '.jpg', $game->cover_image),
                ]);
            }
        });
    }

    public function down(): void {}
};
