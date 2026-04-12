<?php

namespace Database\Seeders;

use App\Models\Game;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class GameSeeder extends Seeder
{
    public function run(): void
    {
        $games = self::games();

        foreach ($games as $game) {
            Game::updateOrCreate(
                ['slug' => Str::slug($game['name'])],
                [...$game, 'slug' => Str::slug($game['name'])]
            );
        }
    }

    public static function games(): array
    {
        return [
            // --- MOBA ---
            [
                'name' => 'Mobile Legends: Bang Bang',
                'genre' => 'MOBA',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/mlbb.jpg',
                'rank_system' => ['Warrior', 'Elite', 'Master', 'Grandmaster', 'Epic', 'Legend', 'Mythic', 'Mythical Glory', 'Immortal'],
            ],
            [
                'name' => 'League of Legends',
                'genre' => 'MOBA',
                'platforms' => ['pc'],
                'cover_image' => '/images/games/lol.jpg',
                'rank_system' => ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Emerald', 'Diamond', 'Master', 'Grandmaster', 'Challenger'],
            ],
            [
                'name' => 'Dota 2',
                'genre' => 'MOBA',
                'platforms' => ['pc'],
                'cover_image' => '/images/games/dota2.jpg',
                'rank_system' => ['Herald', 'Guardian', 'Crusader', 'Archon', 'Legend', 'Ancient', 'Divine', 'Immortal'],
            ],
            [
                'name' => 'Honor of Kings',
                'genre' => 'MOBA',
                'platforms' => ['mobile', 'pc'],
                'cover_image' => '/images/games/hok.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Star', 'King', 'Supreme King'],
            ],
            [
                'name' => 'Arena of Valor',
                'genre' => 'MOBA',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/aov.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Conqueror'],
            ],

            // --- Battle Royale ---
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
                'name' => 'Fortnite',
                'genre' => 'Battle Royale',
                'platforms' => ['pc', 'console', 'mobile'],
                'cover_image' => '/images/games/fortnite.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite', 'Champion', 'Unreal'],
            ],
            [
                'name' => 'Apex Legends',
                'genre' => 'Battle Royale',
                'platforms' => ['pc', 'console'],
                'cover_image' => '/images/games/apex.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Apex Predator'],
            ],

            // --- Tactical / FPS ---
            [
                'name' => 'Valorant',
                'genre' => 'Tactical Shooter',
                'platforms' => ['pc', 'console'],
                'cover_image' => '/images/games/valorant.jpg',
                'rank_system' => ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal', 'Radiant'],
            ],
            [
                'name' => 'Counter-Strike 2',
                'genre' => 'Tactical Shooter',
                'platforms' => ['pc'],
                'cover_image' => '/images/games/cs2.jpg',
                'rank_system' => ['Silver', 'Gold Nova', 'Master Guardian', 'Distinguished Master Guardian', 'Legendary Eagle', 'Supreme', 'Global Elite'],
            ],
            [
                'name' => 'Call of Duty: Mobile',
                'genre' => 'FPS',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/codm.jpg',
                'rank_system' => ['Rookie', 'Veteran', 'Elite', 'Pro', 'Master', 'Grandmaster', 'Legendary'],
            ],
            [
                'name' => 'Overwatch 2',
                'genre' => 'Hero Shooter',
                'platforms' => ['pc', 'console'],
                'cover_image' => '/images/games/overwatch2.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Champion'],
            ],

            // --- RPG / Open World ---
            [
                'name' => 'Genshin Impact',
                'genre' => 'Action RPG',
                'platforms' => ['pc', 'console', 'mobile'],
                'cover_image' => '/images/games/genshin.jpg',
                'rank_system' => null,
            ],

            // --- Other Competitive ---
            [
                'name' => 'Rocket League',
                'genre' => 'Sports',
                'platforms' => ['pc', 'console'],
                'cover_image' => '/images/games/rocketleague.jpg',
                'rank_system' => ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Champion', 'Grand Champion', 'Supersonic Legend'],
            ],
            [
                'name' => 'Brawl Stars',
                'genre' => 'Action',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/brawlstars.jpg',
                'rank_system' => null,
            ],
            [
                'name' => 'Clash Royale',
                'genre' => 'Strategy',
                'platforms' => ['mobile'],
                'cover_image' => '/images/games/clashroyale.jpg',
                'rank_system' => ['Arena 1', 'Arena 2', 'Arena 3', 'Arena 4', 'Arena 5', 'Legendary Arena', 'Champion'],
            ],
            [
                'name' => 'Minecraft',
                'genre' => 'Sandbox',
                'platforms' => ['pc', 'console', 'mobile'],
                'cover_image' => '/images/games/minecraft.jpg',
                'rank_system' => null,
            ],
            [
                'name' => 'Stumble Guys',
                'genre' => 'Party',
                'platforms' => ['mobile', 'pc'],
                'cover_image' => '/images/games/stumbleguys.jpg',
                'rank_system' => null,
            ],
        ];
    }
}
