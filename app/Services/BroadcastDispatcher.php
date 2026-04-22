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

    public function dispatch(Broadcast $broadcast): int
    {
        if ($broadcast->sent_at) {
            return 0; // Already sent; never re-send.
        }

        $userIds = $this->targetUserIds($broadcast);
        if (empty($userIds)) {
            $broadcast->update(['sent_at' => now()]);
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

        // Notify in chunks so a single failing user doesn't nuke the batch.
        $users = User::whereIn('id', $userIds)->get();
        foreach ($users->chunk(200) as $chunk) {
            foreach ($chunk as $user) {
                try {
                    $user->notify(new BroadcastNotification($broadcast));
                    \Illuminate\Support\Facades\Cache::forget("user:{$user->id}:unread");
                } catch (\Throwable $e) {
                    Log::error('Broadcast notify failed', ['user_id' => $user->id, 'e' => $e->getMessage()]);
                }
            }
        }

        $broadcast->update(['sent_at' => now()]);
        return count($userIds);
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
