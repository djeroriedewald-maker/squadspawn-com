<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_owner')->default(false)->after('is_admin');
        });

        // Seed the platform owner. Owners can never be banned, demoted, or
        // modified by other admins — only a DB migration or direct query
        // can change this flag.
        DB::table('users')
            ->where('email', 'djeroriedewald@gmail.com')
            ->update([
                'is_owner' => true,
                'is_admin' => true,
                'is_moderator' => false, // admin already gives mod powers
            ]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_owner');
        });
    }
};
