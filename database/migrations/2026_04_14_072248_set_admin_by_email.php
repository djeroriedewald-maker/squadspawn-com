<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Reset all admins first
        DB::table('users')->update(['is_admin' => false]);

        // Set the only admin by email
        DB::table('users')
            ->where('email', 'djeroriedewald@gmail.com')
            ->update(['is_admin' => true]);
    }

    public function down(): void
    {
        DB::table('users')
            ->where('email', 'djeroriedewald@gmail.com')
            ->update(['is_admin' => false]);
    }
};
