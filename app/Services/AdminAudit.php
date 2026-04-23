<?php

namespace App\Services;

use App\Models\AdminAction;
use App\Models\User;

class AdminAudit
{
    /**
     * Record an admin action. Best-effort — audit logging must never
     * break the action it's recording, so a write failure is swallowed
     * and reported to the app log instead.
     */
    public static function log(string $action, ?User $target = null, array $metadata = [], ?int $actorId = null): void
    {
        try {
            AdminAction::create([
                'actor_user_id' => $actorId ?? auth()->id(),
                'target_user_id' => $target?->id,
                'action' => $action,
                'metadata' => $metadata ?: null,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            \Log::warning('AdminAudit write failed', [
                'action' => $action,
                'target_id' => $target?->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
