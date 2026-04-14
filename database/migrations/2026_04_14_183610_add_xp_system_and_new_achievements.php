<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add XP column to profiles (separate from achievement_points)
        if (!Schema::hasColumn('profiles', 'xp')) {
            Schema::table('profiles', function (Blueprint $table) {
                $table->unsignedInteger('xp')->default(0)->after('achievement_points');
                $table->unsignedTinyInteger('level')->default(1)->after('xp');
            });
        }

        // Update existing achievement point values (make them harder)
        $updates = [
            'first-friend' => ['points' => 15],
            'social-butterfly' => ['points' => 50],
            'squad-leader' => ['points' => 40],
            'team-player' => ['points' => 40],
            'content-creator' => ['points' => 30],
            'game-collector' => ['points' => 25],
            'conversation-starter' => ['points' => 30],
            'early-adopter' => ['points' => 50],
            'top-rated' => ['points' => 75],
            'profile-complete' => ['points' => 20],
        ];

        foreach ($updates as $slug => $data) {
            \DB::table('achievements')->where('slug', $slug)->update($data);
        }

        // Add new achievements
        $now = now();
        $newAchievements = [
            ['slug' => 'first-blood', 'name' => 'First Blood', 'description' => 'Give your first rating to a teammate', 'icon' => 'star', 'color' => 'orange', 'points' => 15],
            ['slug' => 'squad-goals', 'name' => 'Squad Goals', 'description' => 'Complete 5 LFG sessions', 'icon' => 'flag', 'color' => 'green', 'points' => 50],
            ['slug' => 'trusted-player', 'name' => 'Trusted Player', 'description' => 'Receive 10 ratings from other players', 'icon' => 'shield', 'color' => 'cyan', 'points' => 60],
            ['slug' => 'marathon', 'name' => 'Marathon', 'description' => 'Log in 7 days in a row', 'icon' => 'fire', 'color' => 'orange', 'points' => 40],
            ['slug' => 'mentor', 'name' => 'Mentor', 'description' => 'Host 20 LFG groups', 'icon' => 'trophy', 'color' => 'purple', 'points' => 75],
            ['slug' => 'popular', 'name' => 'Popular', 'description' => 'Reach 50 friends', 'icon' => 'users', 'color' => 'pink', 'points' => 100],
            ['slug' => 'all-star', 'name' => 'All-Star', 'description' => 'Maintain 4.5+ reputation with 20+ ratings', 'icon' => 'star', 'color' => 'orange', 'points' => 150],
            ['slug' => 'chatterbox', 'name' => 'Chatterbox', 'description' => 'Send 500 messages', 'icon' => 'chat', 'color' => 'green', 'points' => 50],
            ['slug' => 'recruiter', 'name' => 'Recruiter', 'description' => 'Accept 25 players into your LFG groups', 'icon' => 'megaphone', 'color' => 'cyan', 'points' => 60],
            ['slug' => 'globe-trotter', 'name' => 'Globe Trotter', 'description' => 'Play with people from 5 different regions', 'icon' => 'gamepad', 'color' => 'purple', 'points' => 75],
            ['slug' => 'clip-king', 'name' => 'Clip King', 'description' => 'Share 20 gaming clips', 'icon' => 'video', 'color' => 'pink', 'points' => 50],
            ['slug' => 'no-toxic', 'name' => 'Clean Record', 'description' => '25+ ratings with zero toxic/no-show tags', 'icon' => 'check', 'color' => 'green', 'points' => 100],
        ];

        foreach ($newAchievements as $ach) {
            if (!\DB::table('achievements')->where('slug', $ach['slug'])->exists()) {
                \DB::table('achievements')->insert(array_merge($ach, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]));
            }
        }
    }

    public function down(): void
    {
        // Best-effort rollback
    }
};
