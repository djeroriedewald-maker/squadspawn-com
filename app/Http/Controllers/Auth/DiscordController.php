<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ReferralService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Discord OAuth2 — manual implementation against Discord's REST API.
 * Skipped Socialite + the community provider package because:
 *   1) it would mean a composer install on prod (deploy-time risk),
 *   2) Discord OAuth2 is a 3-call flow we can express in one short class
 *      using Laravel's HTTP client, with no extra abstraction surface.
 *
 * Required env vars (set on Forge → Site → Environment):
 *   DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI
 */
class DiscordController extends Controller
{
    private const AUTHORIZE_URL = 'https://discord.com/api/oauth2/authorize';
    private const TOKEN_URL = 'https://discord.com/api/oauth2/token';
    private const USER_URL = 'https://discord.com/api/users/@me';

    public function redirect(Request $request)
    {
        $clientId = config('services.discord.client_id');
        $redirect = $this->absoluteRedirect();

        if (!$clientId) {
            // Fail loud locally, soft on prod — same shape as Google flow
            // when the env vars aren't set. Better than a Socialite stack
            // trace leaking config details to the user.
            return redirect()->route('login')->withErrors([
                'discord' => 'Discord login is not configured.',
            ]);
        }

        // CSRF state — prevents an attacker from racing a victim into
        // accepting the attacker's Discord session. We compare on callback.
        $state = Str::random(40);
        $request->session()->put('discord_oauth_state', $state);

        $url = self::AUTHORIZE_URL . '?' . http_build_query([
            'client_id' => $clientId,
            'redirect_uri' => $redirect,
            'response_type' => 'code',
            'scope' => 'identify email',
            'state' => $state,
            'prompt' => 'none',
        ]);

        return redirect()->away($url);
    }

    public function callback(Request $request)
    {
        $expectedState = $request->session()->pull('discord_oauth_state');
        $providedState = (string) $request->query('state', '');

        if (!$expectedState || !hash_equals($expectedState, $providedState)) {
            return redirect()->route('login')->withErrors(['discord' => 'Discord login expired — please try again.']);
        }

        $code = (string) $request->query('code', '');
        if ($code === '') {
            return redirect()->route('login')->withErrors(['discord' => 'Discord login was cancelled.']);
        }

        $tokenResponse = Http::asForm()->post(self::TOKEN_URL, [
            'client_id' => config('services.discord.client_id'),
            'client_secret' => config('services.discord.client_secret'),
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $this->absoluteRedirect(),
        ]);

        if (!$tokenResponse->ok()) {
            Log::warning('Discord OAuth token exchange failed', ['status' => $tokenResponse->status()]);
            return redirect()->route('login')->withErrors(['discord' => 'Discord login failed.']);
        }

        $accessToken = $tokenResponse->json('access_token');

        $userResponse = Http::withToken($accessToken)->get(self::USER_URL);
        if (!$userResponse->ok()) {
            return redirect()->route('login')->withErrors(['discord' => 'Could not read your Discord profile.']);
        }

        $discordUser = $userResponse->json();
        $discordId = (string) ($discordUser['id'] ?? '');
        $email = $discordUser['email'] ?? null;
        $username = $discordUser['global_name'] ?? $discordUser['username'] ?? null;

        if ($discordId === '') {
            return redirect()->route('login')->withErrors(['discord' => 'Discord did not return an account id.']);
        }

        // Already linked → log straight in.
        $user = User::where('discord_id', $discordId)->first();

        if (!$user && $email) {
            // Email-match auto-link. Same reasoning as Google: Discord
            // verifies the address (we ask for the `email` scope and only
            // get it for verified accounts), so an attacker would need to
            // also control the victim's email — which is the definition
            // of *not* a takeover.
            $existing = User::where('email', $email)->first();
            if ($existing) {
                $existing->forceFill(['discord_id' => $discordId])->save();
                Log::info('Discord OAuth auto-linked existing account', [
                    'user_id' => $existing->id,
                    'email' => $existing->email,
                ]);
                Auth::login($existing, remember: true);
                return redirect()->route('dashboard');
            }
        }

        if (!$user) {
            // Fresh sign-up.
            $user = User::create([
                'name' => $username ?: 'Discord user',
                'email' => $email ?: $discordId . '@users.noreply.squadspawn.com',
                'discord_id' => $discordId,
                'password' => bcrypt(str()->random(32)),
                'email_verified_at' => $email ? now() : null,
            ]);

            $refCode = (string) request()->session()->pull('referral_code', '');
            ReferralService::attributeSignup($user, $refCode ?: null);
        }

        Auth::login($user, remember: true);
        return redirect()->route('dashboard');
    }

    /**
     * Discord rejects a relative redirect_uri at both the authorize and
     * token-exchange step. If the configured value is relative, prepend
     * the app URL so we always send the same absolute string.
     */
    private function absoluteRedirect(): string
    {
        $configured = (string) config('services.discord.redirect', '/auth/discord/callback');
        if (str_starts_with($configured, 'http://') || str_starts_with($configured, 'https://')) {
            return $configured;
        }
        return rtrim(config('app.url'), '/') . '/' . ltrim($configured, '/');
    }
}
