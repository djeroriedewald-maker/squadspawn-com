<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AdminAction::with([
            'actor:id,name,is_admin,is_owner',
            'actor.profile:user_id,username',
            'target:id,name,is_admin,is_owner,is_banned',
            'target.profile:user_id,username',
        ]);

        if ($request->filled('action')) {
            $query->where('action', $request->input('action'));
        }
        if ($request->filled('actor')) {
            $query->where('actor_user_id', (int) $request->input('actor'));
        }
        if ($request->filled('target')) {
            $query->where('target_user_id', (int) $request->input('target'));
        }

        $actions = $query->orderByDesc('created_at')->orderByDesc('id')
            ->paginate(50)->withQueryString()
            ->through(fn (AdminAction $a) => [
                'id' => $a->id,
                'action' => $a->action,
                'metadata' => $a->metadata,
                'created_at' => $a->created_at?->toDateTimeString(),
                'created_at_human' => $a->created_at?->diffForHumans(),
                'actor' => $a->actor ? [
                    'id' => $a->actor->id,
                    'name' => $a->actor->profile?->username ?? $a->actor->name,
                    'is_owner' => (bool) $a->actor->is_owner,
                ] : null,
                'target' => $a->target ? [
                    'id' => $a->target->id,
                    'name' => $a->target->profile?->username ?? $a->target->name,
                    'is_banned' => (bool) $a->target->is_banned,
                ] : null,
            ]);

        $actionTypes = AdminAction::select('action')->distinct()->orderBy('action')->pluck('action');

        return Inertia::render('Admin/Audit/Index', [
            'actions' => $actions,
            'filters' => $request->only(['action', 'actor', 'target']),
            'actionTypes' => $actionTypes,
        ]);
    }
}
