<?php

namespace App\Http\Controllers;

use App\Models\PlayerMatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class ChatController extends Controller
{
    public function show(PlayerMatch $playerMatch): Response
    {
        $user = auth()->user();

        // Verify the user belongs to this match
        if ($playerMatch->user_one_id !== $user->id && $playerMatch->user_two_id !== $user->id) {
            abort(HttpResponse::HTTP_FORBIDDEN, 'You are not part of this match.');
        }

        $playerMatch->load(['messages.sender', 'userOne.profile', 'userTwo.profile']);

        $partner = $playerMatch->user_one_id === $user->id
            ? $playerMatch->userTwo
            : $playerMatch->userOne;

        return Inertia::render('Chat/Show', [
            'match' => $playerMatch,
            'partner' => $partner,
            'messages' => $playerMatch->messages,
        ]);
    }

    public function store(Request $request, PlayerMatch $playerMatch): JsonResponse
    {
        $user = auth()->user();

        // Verify the user belongs to this match
        if ($playerMatch->user_one_id !== $user->id && $playerMatch->user_two_id !== $user->id) {
            abort(HttpResponse::HTTP_FORBIDDEN, 'You are not part of this match.');
        }

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $message = $playerMatch->messages()->create([
            'sender_id' => $user->id,
            'body' => $validated['body'],
        ]);

        $message->load('sender');

        return response()->json($message, HttpResponse::HTTP_CREATED);
    }
}
