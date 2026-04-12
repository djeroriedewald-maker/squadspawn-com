<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Profile;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(GameSeeder::class);

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        Profile::create([
            'user_id' => $user->id,
            'username' => 'testplayer',
            'bio' => 'Looking for ranked teammates in SEA!',
            'looking_for' => 'ranked',
            'region' => 'SEA',
            'timezone' => 'Asia/Manila',
            'available_times' => ['evening' => true, 'night' => true],
        ]);

        // Create demo users for discovery
        $demoUsers = User::factory(10)->create();
        $regions = ['SEA', 'SEA', 'SEA', 'NA', 'EU'];
        $lookingFor = ['casual', 'ranked', 'friends', 'any'];
        $usernames = ['DragonSlayer', 'ShadowMage', 'NightHawk', 'StormBringer', 'PhoenixRise', 'CyberWolf', 'StarForge', 'IronFist', 'BlazeMaster', 'ArcticFox'];

        foreach ($demoUsers as $i => $demoUser) {
            Profile::create([
                'user_id' => $demoUser->id,
                'username' => $usernames[$i],
                'bio' => 'Looking for cool people to play with!',
                'looking_for' => $lookingFor[array_rand($lookingFor)],
                'region' => $regions[array_rand($regions)],
                'timezone' => 'Asia/Manila',
                'available_times' => ['evening' => true],
            ]);

            // Attach 1-3 random games
            $gameIds = \App\Models\Game::inRandomOrder()->take(rand(1, 3))->pluck('id');
            foreach ($gameIds as $gameId) {
                $game = \App\Models\Game::find($gameId);
                $ranks = $game->rank_system ?? [];
                $demoUser->games()->attach($gameId, [
                    'rank' => $ranks ? $ranks[array_rand($ranks)] : null,
                    'role' => null,
                    'platform' => $game->platforms[0] ?? 'mobile',
                ]);
            }
        }
    }
}
