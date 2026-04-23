<?php

namespace App\Http\Controllers;

use App\Models\PlusWaitlistEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlusWaitlistController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();
        $alreadyJoined = $user
            ? PlusWaitlistEntry::where('user_id', $user->id)
                ->orWhere('email', strtolower((string) $user->email))
                ->exists()
            : false;

        return Inertia::render('Plus/Index', [
            'prefillEmail' => $user?->email ?? '',
            'alreadyJoined' => $alreadyJoined,
            'memberCount' => PlusWaitlistEntry::count(),
            'seo' => [
                'title' => 'SquadSpawn Plus — Join the waitlist',
                'description' => 'A premium tier for SquadSpawn power users. Tell us what you\'d pay for; we\'ll build it when enough of you say yes.',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
            // Honeypot: real users leave this blank; spam bots fill it.
            'website' => ['nullable', 'size:0'],
        ]);

        if (!empty($data['website'] ?? '')) {
            // Silently accept the spam — it doesn't land in the DB.
            return back()->with('message', 'Thanks, you\'re on the list.');
        }

        $normalisedEmail = strtolower(trim($data['email']));
        $user = $request->user();

        PlusWaitlistEntry::updateOrCreate(
            ['email' => $normalisedEmail],
            [
                'user_id' => $user?->id,
                'note' => $data['note'] ?? null,
                'created_at' => now(),
            ],
        );

        return back()->with('message', 'You\'re on the list — thanks! We\'ll email you when Plus goes live.');
    }
}
