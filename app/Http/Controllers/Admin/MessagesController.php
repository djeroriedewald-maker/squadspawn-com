<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MessagesController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status', 'new');
        if (!in_array($status, ['all', ...ContactMessage::STATUSES], true)) {
            $status = 'new';
        }
        $category = $request->input('category');
        if ($category !== null && !array_key_exists($category, ContactMessage::CATEGORIES)) {
            $category = null;
        }

        $query = ContactMessage::with(['user:id,name', 'user.profile:user_id,username']);
        if ($status !== 'all') {
            $query->where('status', $status);
        }
        if ($category) {
            $query->where('category', $category);
        }

        $messages = $query->latest()->paginate(25)->withQueryString()
            ->through(fn (ContactMessage $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'subject' => $m->subject,
                'category' => $m->category ?? 'other',
                'category_label' => ContactMessage::CATEGORIES[$m->category ?? 'other'] ?? 'Other',
                'body' => $m->body,
                'status' => $m->status,
                'created_at' => $m->created_at?->toDateTimeString(),
                'created_at_human' => $m->created_at?->diffForHumans(),
                'user' => $m->user ? [
                    'id' => $m->user->id,
                    'name' => $m->user->profile?->username ?? $m->user->name,
                ] : null,
            ]);

        return Inertia::render('Admin/Messages', [
            'messages' => $messages,
            'filters' => ['status' => $status, 'category' => $category],
            'counts' => [
                'new' => ContactMessage::where('status', 'new')->count(),
                'read' => ContactMessage::where('status', 'read')->count(),
                'replied' => ContactMessage::where('status', 'replied')->count(),
                'archived' => ContactMessage::where('status', 'archived')->count(),
            ],
            'categories' => ContactMessage::CATEGORIES,
        ]);
    }

    public function updateStatus(Request $request, ContactMessage $message): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:new,read,replied,archived'],
        ]);
        $message->update(['status' => $data['status']]);
        return response()->json(['status' => $message->status]);
    }

    public function destroy(ContactMessage $message): RedirectResponse
    {
        $message->delete();
        return back()->with('message', 'Message deleted.');
    }
}
