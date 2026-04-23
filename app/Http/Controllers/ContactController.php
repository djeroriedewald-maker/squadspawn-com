<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Contact/Index', [
            'prefillName' => $user?->profile?->username ?? $user?->name ?? '',
            'prefillEmail' => $user?->email ?? '',
            'seo' => [
                'title' => 'Contact — SquadSpawn',
                'description' => 'Send us a message. We read every one and get back to you personally.',
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:1', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'min:3', 'max:200'],
            'category' => ['nullable', 'string', 'in:' . implode(',', array_keys(ContactMessage::CATEGORIES))],
            'body' => ['required', 'string', 'min:10', 'max:5000'],
            // Honeypot — humans leave this blank; bots usually don't.
            'website' => ['nullable', 'size:0'],
        ]);

        // Silently swallow honeypot-filled spam without touching the DB.
        if (!empty($data['website'] ?? '')) {
            return back()->with('message', 'Message sent. We\'ll get back to you soon.');
        }

        $message = ContactMessage::create([
            'user_id' => $request->user()?->id,
            'name' => $data['name'],
            'email' => strtolower(trim($data['email'])),
            'subject' => $data['subject'],
            'category' => $data['category'] ?? 'other',
            'body' => $data['body'],
            'status' => 'new',
        ]);

        // Ping every admin so a red dot appears on the notification bell
        // + (optionally) a browser push. Best-effort: a push-endpoint hiccup
        // must never break the user's submission.
        try {
            \App\Models\User::where('is_admin', true)
                ->orWhere('is_owner', true)
                ->get()
                ->each
                ->notify(new \App\Notifications\AdminNewContactMessageNotification($message));
        } catch (\Throwable $e) {
            \Log::warning('Admin contact-notify failed', ['error' => $e->getMessage()]);
        }

        return back()->with('message', 'Message sent. We read every one — expect a reply within a few days.');
    }
}
