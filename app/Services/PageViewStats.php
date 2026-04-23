<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Aggregation helpers for the page_views table. Every query is
 * bounded by the date indexes, so hitting this on the admin
 * analytics page stays cheap even once the table grows.
 */
class PageViewStats
{
    public static function summary(): array
    {
        $today = now()->toDateString();
        $from7 = now()->copy()->subDays(6)->toDateString();   // inclusive 7-day window
        $from30 = now()->copy()->subDays(29)->toDateString(); // inclusive 30-day window

        return [
            'pageviews' => [
                'today' => (int) DB::table('page_views')->where('day', $today)->count(),
                '7d' => (int) DB::table('page_views')->where('day', '>=', $from7)->count(),
                '30d' => (int) DB::table('page_views')->where('day', '>=', $from30)->count(),
            ],
            'visitors' => [
                'today' => (int) DB::table('page_views')->where('day', $today)
                    ->distinct()->count('visitor_hash'),
                '7d' => (int) DB::table('page_views')->where('day', '>=', $from7)
                    ->distinct()->count('visitor_hash'),
                '30d' => (int) DB::table('page_views')->where('day', '>=', $from30)
                    ->distinct()->count('visitor_hash'),
            ],
            'top_pages' => DB::table('page_views')
                ->where('day', '>=', $from30)
                ->select('path',
                    DB::raw('count(*) as views'),
                    DB::raw('count(distinct visitor_hash) as visitors'))
                ->groupBy('path')
                ->orderByDesc('views')
                ->limit(10)
                ->get()
                ->map(fn ($r) => [
                    'path' => (string) $r->path,
                    'views' => (int) $r->views,
                    'visitors' => (int) $r->visitors,
                ])
                ->values(),
            'series' => self::dailySeries($from30),
        ];
    }

    /**
     * Daily pageview + unique-visitor counts for the last 30 days.
     * Two SQL queries, stitched together into label/value arrays
     * that the frontend BarChart can consume directly.
     *
     * @return array{labels:array<string>,pageviews:array<int>,visitors:array<int>}
     */
    private static function dailySeries(string $from): array
    {
        $labels = [];
        $byDay = [];
        for ($i = 29; $i >= 0; $i--) {
            $d = now()->copy()->subDays($i)->toDateString();
            $labels[] = now()->copy()->subDays($i)->format('M d');
            $byDay[$d] = ['pv' => 0, 'uv' => 0];
        }

        $pv = DB::table('page_views')
            ->where('day', '>=', $from)
            ->select('day', DB::raw('count(*) as c'))
            ->groupBy('day')->get();
        foreach ($pv as $row) {
            if (isset($byDay[(string) $row->day])) $byDay[(string) $row->day]['pv'] = (int) $row->c;
        }

        $uv = DB::table('page_views')
            ->where('day', '>=', $from)
            ->select('day', DB::raw('count(distinct visitor_hash) as c'))
            ->groupBy('day')->get();
        foreach ($uv as $row) {
            if (isset($byDay[(string) $row->day])) $byDay[(string) $row->day]['uv'] = (int) $row->c;
        }

        return [
            'labels' => $labels,
            'pageviews' => array_values(array_column($byDay, 'pv')),
            'visitors' => array_values(array_column($byDay, 'uv')),
        ];
    }
}
