<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
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

    public function down(): void
    {
        DB::table('games')->update(['cover_image' => null]);
    }
};
