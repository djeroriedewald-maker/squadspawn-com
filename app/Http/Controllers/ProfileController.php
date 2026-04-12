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
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        // GDPR: delete all user data
        $user->profile?->delete();
        $user->games()->detach();
        \App\Models\Like::where('liker_id', $user->id)->orWhere('liked_id', $user->id)->delete();
        \App\Models\Pass::where('passer_id', $user->id)->orWhere('passed_id', $user->id)->delete();
        \App\Models\Message::where('sender_id', $user->id)->delete();
        \App\Models\PlayerMatch::where('user_one_id', $user->id)->orWhere('user_two_id', $user->id)->delete();
        $user->notifications()->delete();

        // Delete uploaded avatar
        if ($user->profile?->avatar && str_starts_with($user->profile->avatar, '/storage/avatars/')) {
            $path = str_replace('/storage/', '', $user->profile->avatar);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
        }

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
