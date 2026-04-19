<?php

namespace App\Http\Controllers;

use App\Models\Profile;

class SitemapController extends Controller
{
    public function index()
    {
        $profiles = Profile::select('username', 'updated_at')->get();

        return response()
            ->view('sitemap', compact('profiles'))
            ->header('Content-Type', 'text/xml');
    }
}
