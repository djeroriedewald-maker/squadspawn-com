<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    protected $signature = 'push:vapid {--force : Print even if keys already exist in .env}';

    protected $description = 'Generate VAPID keys for Web Push and print them to paste into .env';

    public function handle(): int
    {
        if (config('services.webpush.vapid.public_key') && !$this->option('force')) {
            $this->warn('VAPID keys already configured. Use --force to print a new pair anyway.');
            return self::SUCCESS;
        }

        $keys = VAPID::createVapidKeys();

        $this->info('Generated VAPID keys. Add these to your .env:');
        $this->line('');
        $this->line("VAPID_PUBLIC_KEY={$keys['publicKey']}");
        $this->line("VAPID_PRIVATE_KEY={$keys['privateKey']}");
        $this->line("VAPID_SUBJECT=mailto:support@squadspawn.com");
        $this->line('');
        $this->warn("Keep the private key secret. Rotating it invalidates every existing subscription.");

        return self::SUCCESS;
    }
}
