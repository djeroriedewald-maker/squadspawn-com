<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Settings;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Admin/System/Index', [
            'maintenance' => Settings::maintenance(),
            'features' => Settings::features(),
            'flash' => [
                'message' => Settings::get('flash.message'),
                'tone' => Settings::get('flash.tone') ?? 'info',
            ],
            'health' => $this->runHealthChecks(),
        ]);
    }

    private function runHealthChecks(): array
    {
        $checks = [];

        try {
            $start = microtime(true);
            \Illuminate\Support\Facades\DB::connection()->getPdo();
            $ms = round((microtime(true) - $start) * 1000);
            $checks[] = ['key' => 'db', 'ok' => true, 'label' => 'Database', 'detail' => "Connected · {$ms}ms"];
        } catch (\Throwable $e) {
            $checks[] = ['key' => 'db', 'ok' => false, 'label' => 'Database', 'detail' => $e->getMessage()];
        }

        try {
            $probe = 'health:probe:' . now()->timestamp;
            \Illuminate\Support\Facades\Cache::put($probe, '1', 10);
            $got = \Illuminate\Support\Facades\Cache::get($probe) === '1';
            \Illuminate\Support\Facades\Cache::forget($probe);
            $checks[] = ['key' => 'cache', 'ok' => $got, 'label' => 'Cache', 'detail' => $got ? 'Read/write OK' : 'Cannot read back written value'];
        } catch (\Throwable $e) {
            $checks[] = ['key' => 'cache', 'ok' => false, 'label' => 'Cache', 'detail' => $e->getMessage()];
        }

        try {
            $pending = \Illuminate\Support\Facades\DB::table('jobs')->count();
            $failed = \Illuminate\Support\Facades\DB::table('failed_jobs')->count();
            $checks[] = [
                'key' => 'queue',
                'ok' => $failed < 10,
                'label' => 'Queue',
                'detail' => "{$pending} pending · {$failed} failed",
            ];
        } catch (\Throwable) {
            $checks[] = ['key' => 'queue', 'ok' => true, 'label' => 'Queue', 'detail' => 'Not using DB queue'];
        }

        $lastRun = \Illuminate\Support\Facades\Cache::get('broadcasts:scheduler_last_run');
        $schedulerOk = $lastRun && \Illuminate\Support\Carbon::parse($lastRun)->diffInMinutes(now()) < 3;
        $checks[] = [
            'key' => 'scheduler',
            'ok' => $schedulerOk,
            'label' => 'Scheduler',
            'detail' => $lastRun
                ? 'Last run ' . \Illuminate\Support\Carbon::parse($lastRun)->diffForHumans()
                : 'No heartbeat recorded yet',
        ];

        try {
            $bytes = @disk_free_space(storage_path());
            if ($bytes !== false) {
                $gb = round($bytes / 1_073_741_824, 1);
                $checks[] = [
                    'key' => 'disk',
                    'ok' => $gb > 1,
                    'label' => 'Disk free',
                    'detail' => "{$gb} GB available",
                ];
            }
        } catch (\Throwable) { /* skip on restricted hosts */ }

        $pushConfigured = !empty(config('services.webpush.vapid.public_key'));
        $checks[] = [
            'key' => 'push',
            'ok' => $pushConfigured,
            'label' => 'Web push',
            'detail' => $pushConfigured ? 'VAPID keys loaded' : 'VAPID_PUBLIC_KEY missing',
        ];

        return $checks;
    }

    /**
     * Emergency kill-switch: ban, invalidate their remember_token to
     * log them out across devices, close their open LFGs. One call
     * instead of chasing side effects through the UI during a crisis.
     */
    public function killUser(\App\Models\User $user, Request $request): RedirectResponse
    {
        if ($user->is_admin || $user->is_owner) {
            return back()->withErrors(['kill' => 'Admins and owners cannot be killed — strip their role first via Users.']);
        }

        $reason = $request->validate([
            'reason' => 'nullable|string|max:280',
        ])['reason'] ?? 'Emergency kill-switch';

        $user->forceFill([
            'is_banned' => true,
            'banned_at' => now(),
            'ban_reason' => $reason,
            'remember_token' => \Illuminate\Support\Str::random(60),
        ])->save();

        try {
            \App\Models\LfgPost::where('user_id', $user->id)
                ->whereIn('status', ['open', 'full'])
                ->update(['status' => 'closed']);
        } catch (\Throwable) {}

        // Evict all active sessions so the target is logged out across
        // every device in the same breath — the kill-switch contract is
        // "gone right now", not "gone on their next request".
        try {
            \Illuminate\Support\Facades\DB::table('sessions')
                ->where('user_id', $user->id)
                ->delete();
        } catch (\Throwable) {}

        \App\Services\AdminAudit::log('user.killed', $user, ['reason' => $reason]);
        \Illuminate\Support\Facades\Log::warning('Admin kill-switch fired', [
            'admin_id' => $request->user()->id,
            'target_id' => $user->id,
            'target_email' => $user->email,
            'reason' => $reason,
        ]);

        return back()->with('message', "{$user->name} has been killed: banned, logged out, active LFGs closed.");
    }

    public function toggleMaintenance(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'enabled' => 'required|boolean',
            'message' => 'nullable|string|max:280',
            'eta_at' => 'nullable|date',
        ]);

        Settings::setMany([
            'maintenance.enabled' => (bool) $data['enabled'],
            'maintenance.message' => $data['message'] ?? Settings::DEFAULTS['maintenance.message'],
            'maintenance.eta_at' => $data['eta_at'] ?? null,
        ]);

        return back()->with('message', $data['enabled']
            ? 'Maintenance mode is ON. Non-admins are now locked out.'
            : 'Maintenance mode is OFF. Platform is live.');
    }

    public function updateFeatures(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'features' => 'required|array',
            'features.*' => 'boolean',
        ]);

        $pairs = [];
        foreach ($data['features'] as $key => $enabled) {
            // Whitelist the keys we actually know about so an attacker
            // can't stuff arbitrary rows into system_settings.
            if (!array_key_exists('feature.' . $key, Settings::DEFAULTS)) continue;
            $pairs['feature.' . $key] = (bool) $enabled;
        }
        Settings::setMany($pairs);

        return back()->with('message', 'Feature flags saved.');
    }

    public function updateFlash(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'message' => 'nullable|string|max:160',
            'tone' => 'nullable|in:info,warning,danger',
        ]);

        Settings::setMany([
            'flash.message' => $data['message'] ?: null,
            'flash.tone' => $data['tone'] ?? 'info',
        ]);

        return back()->with('message', $data['message']
            ? 'Flash bar is now visible to everyone.'
            : 'Flash bar cleared.');
    }
}
