<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PlusWaitlistEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WaitlistController extends Controller
{
    public function index(Request $request): Response
    {
        $filter = $request->input('filter', 'all'); // all | with-note | registered

        $query = PlusWaitlistEntry::with(['user:id,name', 'user.profile:user_id,username']);
        if ($filter === 'with-note') {
            $query->whereNotNull('note')->where('note', '!=', '');
        } elseif ($filter === 'registered') {
            $query->whereNotNull('user_id');
        }

        $entries = $query->latest('created_at')->paginate(50)->withQueryString()
            ->through(fn (PlusWaitlistEntry $e) => [
                'id' => $e->id,
                'email' => $e->email,
                'note' => $e->note,
                'created_at' => $e->created_at?->toDateTimeString(),
                'created_at_human' => $e->created_at?->diffForHumans(),
                'user' => $e->user ? [
                    'id' => $e->user->id,
                    'name' => $e->user->profile?->username ?? $e->user->name,
                ] : null,
            ]);

        $counts = [
            'all' => PlusWaitlistEntry::count(),
            'with_note' => PlusWaitlistEntry::whereNotNull('note')->where('note', '!=', '')->count(),
            'registered' => PlusWaitlistEntry::whereNotNull('user_id')->count(),
        ];

        return Inertia::render('Admin/Waitlist', [
            'entries' => $entries,
            'filters' => ['filter' => $filter],
            'counts' => $counts,
        ]);
    }

    public function destroy(PlusWaitlistEntry $entry): RedirectResponse
    {
        $entry->delete();
        return back()->with('message', 'Waitlist entry removed.');
    }
}
