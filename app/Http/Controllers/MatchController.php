<?php

namespace App\Http\Controllers;

use App\Models\PlayerMatch;
use Inertia\Inertia;
use Inertia\Response;

class MatchController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $matches = PlayerMatch::where('user_one_id', $user->id)
            ->orWhere('user_two_id', $user->id)
            ->with(['userOne.profile', 'userTwo.profile'])
            ->latest()
            ->get()
            ->map(function (PlayerMatch $match) use ($user) {
                $partner = $match->user_one_id === $user->id
                    ? $match->userTwo
                    : $match->userOne;

                return [
                    'id' => $match->id,
                    'partner' => $partner,
                    'created_at' => $match->created_at,
                ];
            });

        return Inertia::render('Matches/Index', [
            'matches' => $matches,
        ]);
    }
}
