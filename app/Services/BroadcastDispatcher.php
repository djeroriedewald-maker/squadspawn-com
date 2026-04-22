<?php

namespace App\Services;

use App\Models\Broadcast;
use App\Models\BroadcastView;
use App\Models\User;
use App\Notifications\BroadcastNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;

/**
 * Owns the two operations around sending a broadcast:
 *   - `targetUserIds`: given a broadcast's target_filters, return the set
 *     of user IDs the popup should surface to.
 *   - `dispatch`: materialise a broadcast_views row per target user, fire
 *     the push + in-app notification, and stamp broadcasts.sent_at.
 *
 * Also used in preview mode by the admin UI so the "Send to N users"
 * button shows the real audience count.
 */
class BroadcastDispatcher
{
    /** @return array<int> */
    public function targetUserIds(Broadcast $broadcast): array
    {
        return $this->targetQuery($broadcast)->pluck('users.id')->all();
    }

    public function targetCount(Broadcast $broadcast): int
    {
        return $this->targetQuery($broadcast)->count();
    }

    public function dispatch(Broadcast $broadcast, ?array $overrideUserIds = null): int
    {
        if ($broadcast->sent_at) {
            return 0; // Already sent; never re-send.
        }

        $userIds = $overrideUserIds ?? $this->targetUserIds($broadcast);
        if (empty($userIds)) {
            // Safe-update: if the push-stats migration hasn't landed yet
            // (fresh deploy without migrate), fall back to just stamping
            // sent_at so the admin can at least close out the broadcast.
            $this->safeUpdate($broadcast, ['sent_at' => now(), 'push_eligible_count' => 0, 'push_sent_count' => 0]);
            return 0;
        }

        // Materialise delivery rows first — guarantees the popup surfaces
        // even if the push channel throws.
        $now = now();
        $rows = array_map(fn (int $uid) => [
            'broadcast_id' => $broadcast->id,
            'user_id' => $uid,
            'created_at' => $now,
            'updated_at' => $now,
        ], $userIds);
        BroadcastView::insertOrIgnore($rows);

        // Count how many targeted users actually have a push subscription
        // on file — a "could we have pinged them" denominator for stats.
        $pushEligibleCount = $broadcast->push_enabled
            ? \App\Models\PushSubscription::whereIn('user_id', $userIds)
                ->distinct()
                ->count('user_id')
            : 0;

        // Notify in chunks so a single failing user doesn't nuke the batch.
        $users = User::whereIn('id', $userIds)->get();
        $pushSentCount = 0;
        foreach ($users->chunk(200) as $chunk) {
            foreach ($chunk as $user) {
                try {
                    $user->notify(new BroadcastNotification($broadcast));
                    \Illuminate\Support\Facades\Cache::forget("user:{$user->id}:unread");

                    // Increment the "actually fired a push" counter only if
                    // this user has a subscription AND the announcement
                    // type isn't muted — mirrors WebPushChannel's checks.
                    if (
                        $broadcast->push_enabled
                        && $user->wantsPush('announcement')
                        && $user->pushSubscriptions()->exists()
                    ) {
                        $pushSentCount++;
                    }
                } catch (\Throwable $e) {
                    Log::error('Broadcast notify failed', ['user_id' => $user->id, 'e' => $e->getMessage()]);
                }
            }
        }

        Log::info('Broadcast dispatched', [
            'broadcast_id' => $broadcast->id,
            'target_count' => count($userIds),
            'push_eligible' => $pushEligibleCount,
            'push_sent' => $pushSentCount,
        ]);

        $this->safeUpdate($broadcast, [
            'sent_at' => now(),
            'push_eligible_count' => $pushEligibleCount,
            'push_sent_count' => $pushSentCount,
        ]);
        return count($userIds);
    }

    /**
     * Update tolerant of missing columns — if the push-stats migration
     * hasn't run yet, drop those keys and try again. Prevents a fresh
     * deploy from 500ing when a broadcast is dispatched before migrate.
     */
    private function safeUpdate(Broadcast $broadcast, array $attrs): void
    {
        try {
            $broadcast->update($attrs);
        } catch (\Throwable $e) {
            Log::warning('Broadcast update fell back (likely pending migration): ' . $e->getMessage());
            $broadcast->update(array_intersect_key($attrs, ['sent_at' => true]));
        }
    }

    /** Query builder matching the broadcast's targeting rules. */
    private function targetQuery(Broadcast $broadcast): Builder
    {
        $filters = $broadcast->target_filters ?? [];
        $query = User::query()->where('is_banned', false);

        if (!empty($filters['game_ids'])) {
            $query->whereHas('games', fn ($q) => $q->whereIn('games.id', $filters['game_ids']));
        }

        if (!empty($filters['regions'])) {
            $query->whereHas('profile', fn ($q) => $q->whereIn('region', $filters['regions']));
        }

        if (!empty($filters['min_level'])) {
            $query->whereHas('profile', fn ($q) => $q->where('level', '>=', (int) $filters['min_level']));
        }

        return $query;
    }
}
