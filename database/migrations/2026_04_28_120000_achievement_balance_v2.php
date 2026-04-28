<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Achievement balance pass v2 — Legend stays hard.
 *
 *  - Adds a `tier` column to power tile-styling (bronze/silver/gold/platinum)
 *    so the frontend can pick a per-tier image + accent without recomputing
 *    from points on every render.
 *  - Backfills existing rows by points band (≤25 bronze, 30-50 silver,
 *    60-100 gold, 150+ platinum).
 *  - Inserts three "endgame" platinum achievements that gate the Legend
 *    path: Hall of Famer / Pillar of the Community / Living Legend.
 *
 * The XP-per-action map and level thresholds live in AchievementService;
 * this migration only touches schema + seed data.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('achievements', function (Blueprint $table) {
            $table->string('tier', 16)->default('bronze')->after('color');
        });

        // Backfill tier from existing points so the v1 catalogue lines up
        // with the new visual system. Idempotent — only writes the bucket
        // each row falls into right now.
        DB::table('achievements')->where('points', '<=', 25)->update(['tier' => 'bronze']);
        DB::table('achievements')->whereBetween('points', [26, 50])->update(['tier' => 'silver']);
        DB::table('achievements')->whereBetween('points', [51, 100])->update(['tier' => 'gold']);
        DB::table('achievements')->where('points', '>=', 150)->update(['tier' => 'platinum']);

        $now = now();
        $endgame = [
            [
                'slug' => 'hall-of-famer',
                'name' => 'Hall of Famer',
                'description' => 'Receive 100+ ratings with a 4.7+ average and zero toxic flags',
                'icon' => 'trophy',
                'color' => 'orange',
                'tier' => 'platinum',
                'points' => 500,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'pillar-of-the-community',
                'name' => 'Pillar of the Community',
                'description' => 'Host 50 LFGs with an 80%+ accept-rate on responses',
                'icon' => 'shield',
                'color' => 'orange',
                'tier' => 'platinum',
                'points' => 250,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'living-legend',
                'name' => 'Living Legend',
                'description' => 'Reach Level 6 — the rarest tier on SquadSpawn',
                'icon' => 'star',
                'color' => 'orange',
                'tier' => 'platinum',
                'points' => 500,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($endgame as $row) {
            if (!DB::table('achievements')->where('slug', $row['slug'])->exists()) {
                DB::table('achievements')->insert($row);
            }
        }
    }

    public function down(): void
    {
        DB::table('achievements')->whereIn('slug', [
            'hall-of-famer', 'pillar-of-the-community', 'living-legend',
        ])->delete();

        Schema::table('achievements', function (Blueprint $table) {
            $table->dropColumn('tier');
        });
    }
};
