<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->json('roles')->nullable()->after('rank_system');
        });

        // Populate game-specific roles
        $roles = [
            'mobile-legends-bang-bang' => ['Tank', 'Fighter', 'Assassin', 'Mage', 'Marksman', 'Support'],
            'league-of-legends' => ['Top', 'Jungle', 'Mid', 'ADC', 'Support'],
            'dota-2' => ['Carry', 'Midlaner', 'Offlaner', 'Soft Support', 'Hard Support'],
            'honor-of-kings' => ['Tank', 'Warrior', 'Assassin', 'Mage', 'Marksman', 'Support'],
            'arena-of-valor' => ['Tank', 'Warrior', 'Assassin', 'Mage', 'Marksman', 'Support'],
            'valorant' => ['Duelist', 'Controller', 'Sentinel', 'Initiator'],
            'counter-strike-2' => ['Entry Fragger', 'AWPer', 'Lurker', 'Support', 'IGL'],
            'overwatch-2' => ['Tank', 'DPS', 'Support'],
            'apex-legends' => ['Assault', 'Skirmisher', 'Recon', 'Controller', 'Support'],
            'call-of-duty-mobile' => ['Slayer', 'Objective', 'Anchor', 'Support'],
            'free-fire' => ['Rusher', 'Sniper', 'Support', 'Strategist'],
            'rocket-league' => ['Striker', 'Midfielder', 'Defender', 'Goalkeeper'],
            'brawl-stars' => ['Damage Dealer', 'Tank', 'Support', 'Assassin'],
        ];

        foreach ($roles as $slug => $gameRoles) {
            DB::table('games')->where('slug', $slug)->update(['roles' => json_encode($gameRoles)]);
        }
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('roles');
        });
    }
};
