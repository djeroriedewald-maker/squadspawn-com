<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $games = \Database\Seeders\GameSeeder::games();

        foreach ($games as $game) {
            $slug = Str::slug($game['name']);
            $existing = DB::table('games')->where('slug', $slug)->first();

            if ($existing) {
                DB::table('games')->where('slug', $slug)->update([
                    'platforms' => json_encode($game['platforms']),
                    'cover_image' => $game['cover_image'],
                    'rank_system' => $game['rank_system'] ? json_encode($game['rank_system']) : null,
                ]);
            } else {
                DB::table('games')->insert([
                    'name' => $game['name'],
                    'slug' => $slug,
                    'genre' => $game['genre'],
                    'platforms' => json_encode($game['platforms']),
                    'cover_image' => $game['cover_image'],
                    'rank_system' => $game['rank_system'] ? json_encode($game['rank_system']) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        $newSlugs = [
            'dota-2', 'arena-of-valor', 'fortnite', 'apex-legends',
            'counter-strike-2', 'overwatch-2', 'genshin-impact',
            'rocket-league', 'brawl-stars', 'clash-royale', 'minecraft', 'stumble-guys',
        ];
        DB::table('games')->whereIn('slug', $newSlugs)->delete();
    }
};
