<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Weekly digest every Monday at 9:00 AM
Schedule::command('digest:send-weekly')->weeklyOn(1, '09:00');

// Scheduled broadcasts — check every minute for anything due. The command
// no-ops when the queue is empty, so running it constantly is cheap.
Schedule::command('broadcasts:dispatch-scheduled')->everyMinute()->withoutOverlapping();
