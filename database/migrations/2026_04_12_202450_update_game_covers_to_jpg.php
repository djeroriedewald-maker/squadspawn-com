<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $images = [
            'mobile-legends-bang-bang' => '/images/games/mlbb.jpg',
            'pubg-mobile' => '/images/games/pubgm.jpg',
            'free-fire' => '/images/games/freefire.jpg',
            'honor-of-kings' => '/images/games/hok.jpg',
            'valorant' => '/images/games/valorant.jpg',
            'league-of-legends' => '/images/games/lol.jpg',
            'call-of-duty-mobile' => '/images/games/codm.jpg',
        ];

        foreach ($images as $slug => $image) {
            DB::table('games')->where('slug', $slug)->update(['cover_image' => $image]);
        }
    }

    public function down(): void
    {
        // revert to svg
        $images = [
            'mobile-legends-bang-bang' => '/images/games/mlbb.svg',
            'pubg-mobile' => '/images/games/pubgm.svg',
            'free-fire' => '/images/games/freefire.svg',
            'honor-of-kings' => '/images/games/hok.svg',
            'valorant' => '/images/games/valorant.svg',
            'league-of-legends' => '/images/games/lol.svg',
            'call-of-duty-mobile' => '/images/games/codm.svg',
        ];

        foreach ($images as $slug => $image) {
            DB::table('games')->where('slug', $slug)->update(['cover_image' => $image]);
        }
    }
};
