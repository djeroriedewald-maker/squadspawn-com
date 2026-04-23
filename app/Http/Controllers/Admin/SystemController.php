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
        ]);
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
