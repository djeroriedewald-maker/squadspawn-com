<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account. Exhaustive cleanup across every table
     * that holds user-linked data, plus any uploaded files — so we don't
     * depend on a specific FK cascade being configured.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Users who signed up via Google never picked a password — we
        // generated a random bcrypt on their behalf, so `current_password`
        // can't be satisfied. Fall back to a typed-string confirmation
        // ("DELETE") for those accounts. Password accounts still use the
        // stronger current-password check.
        if ($user->google_id) {
            $request->validate([
                'confirmation' => ['required', 'in:DELETE'],
            ], [
                'confirmation.in' => 'Type DELETE in capital letters to confirm.',
            ]);
        } else {
            $request->validate([
                'password' => ['required', 'current_password'],
            ]);
        }

        $userId = $user->id;

        Auth::logout();

        // Remove uploaded files before the DB rows disappear (we need the
        // paths to clean disk).
        $this->deleteUserFiles($user);

        // Profile
        $user->profile?->delete();

        // Gaming graph
        $user->games()->detach();
        \App\Models\Like::where('liker_id', $userId)->orWhere('liked_id', $userId)->delete();
        \App\Models\Pass::where('passer_id', $userId)->orWhere('passed_id', $userId)->delete();
        \App\Models\PlayerMatch::where('user_one_id', $userId)->orWhere('user_two_id', $userId)->delete();
        \App\Models\PlayerRating::where('rater_id', $userId)->orWhere('rated_id', $userId)->delete();

        // Messaging
        \App\Models\Message::where('sender_id', $userId)->delete();

        // Content
        \App\Models\Clip::where('user_id', $userId)->delete();
        \App\Models\CommunityPost::where('user_id', $userId)->delete();
        \App\Models\PostComment::where('user_id', $userId)->delete();
        \App\Models\PostVote::where('user_id', $userId)->delete();

        // LFG
        \App\Models\LfgPost::where('user_id', $userId)->delete();
        if (class_exists(\App\Models\LfgResponse::class)) {
            \App\Models\LfgResponse::where('user_id', $userId)->delete();
        }
        if (class_exists(\App\Models\LfgRating::class)) {
            \App\Models\LfgRating::where('rater_id', $userId)
                ->orWhere('rated_id', $userId)
                ->delete();
        }

        // Moderation
        \App\Models\Block::where('blocker_id', $userId)->orWhere('blocked_id', $userId)->delete();
        if (class_exists(\App\Models\Report::class)) {
            \App\Models\Report::where('reporter_id', $userId)
                ->orWhere('reported_id', $userId)
                ->delete();
        }

        // Gamification
        \DB::table('user_achievements')->where('user_id', $userId)->delete();

        // Push
        \App\Models\PushSubscription::where('user_id', $userId)->delete();

        // System notifications (database channel)
        $user->notifications()->delete();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Remove any files on disk that belong to the user.
     */
    private function deleteUserFiles($user): void
    {
        if ($user->profile?->avatar && str_starts_with($user->profile->avatar, '/storage/avatars/')) {
            $path = str_replace('/storage/', '', $user->profile->avatar);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
        }
    }
}
