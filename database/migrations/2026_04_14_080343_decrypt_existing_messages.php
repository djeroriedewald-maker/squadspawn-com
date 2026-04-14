<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Decrypt any encrypted messages back to plain text
        DB::table('messages')->get()->each(function ($message) {
            try {
                $decrypted = Crypt::decryptString($message->body);
                DB::table('messages')->where('id', $message->id)->update(['body' => $decrypted]);
            } catch (\Exception $e) {
                // Already plain text, skip
            }
        });

        // Same for LFG messages
        DB::table('lfg_messages')->get()->each(function ($message) {
            try {
                $decrypted = Crypt::decryptString($message->body);
                DB::table('lfg_messages')->where('id', $message->id)->update(['body' => $decrypted]);
            } catch (\Exception $e) {
                // Already plain text, skip
            }
        });
    }

    public function down(): void
    {
        // Cannot re-encrypt
    }
};
