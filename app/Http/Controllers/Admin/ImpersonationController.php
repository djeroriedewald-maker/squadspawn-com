<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Admin "log in as" flow. Stashes the admin's own user id in the
 * session before switching — one click to return with all roles
 * intact. Never allows impersonating another admin (too easy to
 * escalate/cover your tracks accidentally).
 */
class ImpersonationController extends Controller
{
    public const SESSION_KEY = 'impersonator_id';

    public function start(Request $request, User $user): RedirectResponse
    {
        $admin = $request->user();

        // Guard rails: we only impersonate non-admin, non-owner accounts,
        // and never from inside an existing impersonation session.
        if ($request->session()->has(self::SESSION_KEY)) {
            return back()->withErrors(['impersonation' => 'Already impersonating — stop the current session first.']);
        }
        if ($user->id === $admin->id) {
            return back()->withErrors(['impersonation' => 'You cannot impersonate yourself.']);
        }
        if ($user->is_admin || $user->is_owner) {
            return back()->withErrors(['impersonation' => 'Admins and owners cannot be impersonated.']);
        }
        if ($user->is_banned) {
            return back()->withErrors(['impersonation' => 'This account is banned. Unban before impersonating to debug.']);
        }

        // Log the switch so moderation has a paper trail of who-did-what.
        \App\Services\AdminAudit::log('impersonation.started', $user);
        Log::info('Admin impersonation started', [
            'admin_id' => $admin->id,
            'admin_email' => $admin->email,
            'target_id' => $user->id,
            'target_email' => $user->email,
            'ip' => $request->ip(),
        ]);

        $request->session()->put(self::SESSION_KEY, $admin->id);
        Auth::login($user);

        return redirect()->route('dashboard')->with('message', "Impersonating {$user->name}. Use the red banner to return.");
    }

    public function stop(Request $request): RedirectResponse
    {
        $originalId = $request->session()->pull(self::SESSION_KEY);
        if (!$originalId) {
            return redirect()->route('dashboard');
        }

        $original = User::find($originalId);
        if (!$original) {
            Auth::logout();
            return redirect()->route('login');
        }

        $impersonated = $request->user();
        // Attribute the stop to the original admin (actor), targeting
        // the user they were debugging as.
        \App\Services\AdminAudit::log('impersonation.stopped', $impersonated, [], $original->id);
        Log::info('Admin impersonation ended', [
            'admin_id' => $original->id,
            'target_id' => $impersonated?->id,
        ]);

        Auth::login($original);

        return redirect()->route('admin.users')->with('message', 'Back in admin mode.');
    }
}
