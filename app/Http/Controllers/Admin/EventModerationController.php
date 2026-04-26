<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EventModerationController extends Controller
{
    public function index(): Response
    {
        $pending = Event::with(['host:id,name', 'host.profile:user_id,username,avatar', 'game:id,name,slug'])
            ->where('status', 'pending_review')
            ->orderBy('created_at', 'asc')
            ->get();

        $recent = Event::with(['host:id,name', 'host.profile:user_id,username', 'approver:id,name'])
            ->whereIn('status', ['published', 'rejected', 'cancelled'])
            ->orderByDesc('updated_at')
            ->take(20)
            ->get();

        return Inertia::render('Admin/Events/Queue', [
            'pending' => $pending,
            'recent' => $recent,
        ]);
    }

    public function approve(Event $event): RedirectResponse
    {
        $event->update([
            'status' => 'published',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
            'rejected_reason' => null,
        ]);
        return back()->with('message', 'Event approved.');
    }

    public function reject(Request $request, Event $event): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $event->update([
            'status' => 'rejected',
            'rejected_reason' => $validated['reason'],
            'approved_at' => null,
            'approved_by' => null,
        ]);

        return back()->with('message', 'Event rejected.');
    }
}
