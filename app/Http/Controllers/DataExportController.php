<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * GDPR Article 20 — Right to data portability.
 *
 * Returns every piece of personal data we hold about the authenticated user
 * as a machine-readable JSON download.
 */
class DataExportController extends Controller
{
    public function index(): StreamedResponse
    {
        $user = auth()->user();
        $user->load(['profile', 'games', 'achievements']);

        $data = [
            'exported_at' => now()->toAtomString(),
            'exported_for' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'date_of_birth' => $user->date_of_birth,
                'created_at' => $user->created_at?->toAtomString(),
                'email_verified_at' => $user->email_verified_at?->toAtomString(),
                'google_linked' => !empty($user->google_id),
                'notification_preferences' => $user->notification_preferences,
            ],
            'profile' => $user->profile ? $user->profile->only([
                'username', 'bio', 'region', 'timezone', 'avatar',
                'looking_for', 'age_verified_at', 'is_creator', 'level',
                'xp', 'reputation_score', 'created_at', 'updated_at',
            ]) : null,
            'games' => $user->games->map(fn ($g) => [
                'name' => $g->name,
                'slug' => $g->slug,
                'rank' => $g->pivot->rank ?? null,
                'role' => $g->pivot->role ?? null,
                'platform' => $g->pivot->platform ?? null,
                'added_at' => optional($g->pivot->created_at)?->toAtomString(),
            ])->values(),
            'achievements' => $user->achievements->map(fn ($a) => [
                'slug' => $a->slug,
                'name' => $a->name,
                'earned_at' => optional($a->pivot->created_at)?->toAtomString(),
            ])->values(),
            'friendships' => \App\Models\PlayerMatch::where('user_one_id', $user->id)
                ->orWhere('user_two_id', $user->id)
                ->get()
                ->map(fn ($m) => [
                    'uuid' => $m->uuid,
                    'partner_id' => $m->user_one_id === $user->id ? $m->user_two_id : $m->user_one_id,
                    'created_at' => $m->created_at?->toAtomString(),
                ])->values(),
            'referral' => [
                'my_code' => $user->referral_code,
                'referred_by_user_id' => $user->referred_by_user_id,
                'invited_by_me' => \App\Models\User::where('referred_by_user_id', $user->id)
                    ->get(['id', 'created_at'])
                    ->map(fn ($u) => [
                        'invited_user_id' => $u->id,
                        'signed_up_at' => $u->created_at?->toAtomString(),
                    ])->values(),
            ],
            'ratings_given' => \App\Models\PlayerRating::where('rater_id', $user->id)
                ->get(['rated_id', 'score', 'tag', 'created_at']),
            'ratings_received' => \App\Models\PlayerRating::where('rated_id', $user->id)
                ->get(['rater_id', 'score', 'tag', 'created_at']),
            'lfg_ratings_given' => \App\Models\LfgRating::where('rater_id', $user->id)
                ->get(['lfg_post_id', 'rated_id', 'score', 'tag', 'comment', 'created_at']),
            'lfg_ratings_received' => \App\Models\LfgRating::where('rated_id', $user->id)
                ->get(['lfg_post_id', 'rater_id', 'score', 'tag', 'comment', 'created_at']),
            'clips' => \App\Models\Clip::where('user_id', $user->id)
                ->get(['title', 'url', 'platform', 'thumbnail', 'created_at']),
            'community_posts' => \App\Models\CommunityPost::where('user_id', $user->id)
                ->get(['title', 'body', 'created_at']),
            'community_comments' => \App\Models\PostComment::where('user_id', $user->id)
                ->get(['community_post_id', 'body', 'created_at']),
            'lfg_posts' => \App\Models\LfgPost::where('user_id', $user->id)
                ->get(['slug', 'title', 'description', 'status', 'created_at']),
            'likes_given' => \App\Models\Like::where('liker_id', $user->id)
                ->get(['liked_id', 'created_at']),
            'passes_given' => \App\Models\Pass::where('passer_id', $user->id)
                ->get(['passed_id', 'created_at']),
            'messages_sent' => \App\Models\Message::where('sender_id', $user->id)
                ->latest()
                ->limit(5000)
                ->get(['match_id', 'body', 'created_at']),
            'blocked_users' => \App\Models\Block::where('blocker_id', $user->id)
                ->get(['blocked_id', 'created_at']),
            'reports_filed' => \App\Models\Report::where('reporter_id', $user->id)
                ->get(['reported_id', 'reason', 'details', 'status', 'created_at']),
            'push_subscriptions' => \App\Models\PushSubscription::where('user_id', $user->id)
                ->get(['endpoint', 'user_agent', 'created_at']),
            'broadcast_views' => \App\Models\BroadcastView::where('user_id', $user->id)
                ->get(['broadcast_id', 'seen_at', 'dismissed_at', 'cta_clicked_at', 'created_at']),
            'notifications' => $user->notifications()
                ->latest()
                ->limit(500)
                ->get(['type', 'data', 'read_at', 'created_at']),
        ];

        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $filename = 'squadspawn-data-' . $user->id . '-' . now()->format('Y-m-d') . '.json';

        return response()->streamDownload(
            fn () => print($json),
            $filename,
            [
                'Content-Type' => 'application/json',
                'Cache-Control' => 'no-store, private',
            ],
        );
    }
}
