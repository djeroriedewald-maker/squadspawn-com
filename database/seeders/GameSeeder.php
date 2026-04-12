<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        $games = [
            [
                'name' => 'Mobile Legends: Bang Bang',
                'genre' => 'MOBA',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/mlbb.jpg',
                'rank_system' => ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythical Glory', 'Immortal'],
            ],
            [
                'name' => 'PUBG Mobile',
                'genre' => 'Battle Royale',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/pubgm.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Ace Master', 'Conqueror'],
            ],
            [
                'name' => 'Free Fire',
                'genre' => 'Battle Royale',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/freefire.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Heroic', 'Grandmaster'],
            ],
            [
                'name' => 'Honor of Kings',
                'genre' => 'MOBA',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/hok.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Star', 'King', 'Supreme King'],
            ],
            [
                'name' => 'Valorant',
                'genre' => 'Tactical Shooter',
                'platforms' => ['pc'],
                'cover_image' => '/images/games/valorant.jpg',
                'rank_system' => ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
            ],
            [
                'name' => 'League of Legends',
                'genre' => 'MOBA',
                'platforms' => ['pc'],
                'cover_image' => '/images/games/lol.jpg',
                'rank_system' => ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
            ],
            [
                'name' => 'Call of Duty: Mobile',
                'genre' => 'FPS',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/codm.jpg',
                'rank_system' => ['Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Grandmaster', 'Legendary'],
            ],
        ];

        foreach ($games as $game) {
            Game::create([
                ...$game,
                'slug' => Str::slug($game['name']),
            ]);
        }
    }
}
