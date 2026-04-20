<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('referral_code', 12)->nullable()->unique();
            $table->foreignId('referred_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('referral_rewarded_at')->nullable();
        });

        // Backfill codes for existing users
        $existing = DB::table('users')->whereNull('referral_code')->pluck('id');
        foreach ($existing as $id) {
            DB::table('users')->where('id', $id)->update([
                'referral_code' => $this->generateUniqueCode(),
            ]);
        }

        Schema::table('profiles', function (Blueprint $table) {
            $table->string('steam_id', 32)->nullable()->unique();
            $table->timestamp('steam_synced_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('profiles', function (Blueprint $table) {
            $table->dropColumn(['steam_id', 'steam_synced_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referred_by_user_id');
            $table->dropColumn(['referral_code', 'referral_rewarded_at']);
        });
    }

    private function generateUniqueCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (DB::table('users')->where('referral_code', $code)->exists());
        return $code;
    }
};
