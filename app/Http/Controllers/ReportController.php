<?php

namespace App\Http\Controllers;

use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'reported_id' => ['required', 'integer', 'exists:users,id'],
            'lfg_post_id' => ['nullable', 'integer', 'exists:lfg_posts,id'],
            'reason' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string', 'max:2000'],
        ]);

        $userId = auth()->id();

        if ($request->reported_id == $userId) {
            return response()->json(['message' => 'You cannot report yourself.'], 422);
        }

        Report::create([
            'reporter_id' => $userId,
            'reported_id' => $request->reported_id,
            'lfg_post_id' => $request->lfg_post_id,
            'reason' => $request->reason,
            'details' => $request->details,
        ]);

        return response()->json(['message' => 'Report submitted successfully.']);
    }
}
