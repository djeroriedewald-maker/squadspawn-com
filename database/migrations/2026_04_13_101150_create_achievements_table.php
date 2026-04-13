<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('description');
            $table->string('icon');
            $table->string('color')->default('purple');
            $table->integer('points')->default(10);
            $table->timestamps();
        });

        $now = now();
        DB::table('achievements')->insert([
            ['slug' => 'first-friend', 'name' => 'First Friend', 'description' => 'Made your first friend', 'icon' => 'heart', 'color' => 'green', 'points' => 10, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'social-butterfly', 'name' => 'Social Butterfly', 'description' => 'Made 10 friends', 'icon' => 'users', 'color' => 'pink', 'points' => 25, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'squad-leader', 'name' => 'Squad Leader', 'description' => 'Created 5 LFG groups', 'icon' => 'flag', 'color' => 'purple', 'points' => 20, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'team-player', 'name' => 'Team Player', 'description' => 'Joined 10 LFG groups', 'icon' => 'shield', 'color' => 'cyan', 'points' => 20, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'content-creator', 'name' => 'Content Creator', 'description' => 'Shared 5 clips', 'icon' => 'video', 'color' => 'orange', 'points' => 15, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'game-collector', 'name' => 'Game Collector', 'description' => 'Added 5 games to your profile', 'icon' => 'gamepad', 'color' => 'purple', 'points' => 15, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'conversation-starter', 'name' => 'Conversation Starter', 'description' => 'Sent 50 messages', 'icon' => 'chat', 'color' => 'green', 'points' => 15, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'early-adopter', 'name' => 'Early Adopter', 'description' => 'Joined SquadSpawn in its early days', 'icon' => 'star', 'color' => 'orange', 'points' => 30, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'top-rated', 'name' => 'Top Rated', 'description' => 'Average LFG rating of 4.5+', 'icon' => 'trophy', 'color' => 'orange', 'points' => 30, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'community-voice', 'name' => 'Community Voice', 'description' => 'Created 10 community posts', 'icon' => 'megaphone', 'color' => 'cyan', 'points' => 20, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'popular-post', 'name' => 'Popular Post', 'description' => 'Got 10 upvotes on a post', 'icon' => 'fire', 'color' => 'pink', 'points' => 25, 'created_at' => $now, 'updated_at' => $now],
            ['slug' => 'profile-complete', 'name' => 'Profile Complete', 'description' => 'Completed your entire profile', 'icon' => 'check', 'color' => 'green', 'points' => 10, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('achievements');
    }
};
