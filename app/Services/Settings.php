<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Thin key-value store on top of system_settings. Every read is
 * cached so middleware can check `maintenance.enabled` on every
 * request without round-tripping the DB. Writes bust the cache.
 */
class Settings
{
    private const CACHE_KEY = 'system_settings:all';
    private const TTL = 3600;

    /** Default values for known keys — returned when the row is missing. */
    public const DEFAULTS = [
        'maintenance.enabled' => false,
        'maintenance.message' => 'We\'re rebuilding the squad. Back in a moment.',
        'maintenance.eta_at' => null,
        'feature.lfg' => true,
        'feature.discovery' => true,
        'feature.community' => true,
        'feature.clips' => true,
        'feature.chat' => true,
        'feature.registration' => true,
        'flash.message' => null,
        'flash.tone' => 'info', // info | warning | danger
    ];

    /** @return mixed */
    public static function get(string $key, $default = null)
    {
        $all = self::all();
        if (array_key_exists($key, $all)) {
            return $all[$key];
        }
        return $default ?? (self::DEFAULTS[$key] ?? null);
    }

    public static function enabled(string $key): bool
    {
        return (bool) self::get($key);
    }

    /** @param mixed $value */
    public static function set(string $key, $value): void
    {
        DB::table('system_settings')->updateOrInsert(
            ['key' => $key],
            ['value' => json_encode($value), 'updated_at' => now(), 'created_at' => now()],
        );
        Cache::forget(self::CACHE_KEY);
    }

    public static function setMany(array $pairs): void
    {
        foreach ($pairs as $k => $v) self::set($k, $v);
    }

    /**
     * Whole-map read, merged with defaults. Cached so the hot path
     * (middleware + Inertia share) is ~no cost after the first hit.
     *
     * @return array<string, mixed>
     */
    public static function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::TTL, function () {
            $rows = DB::table('system_settings')->get();
            $map = self::DEFAULTS;
            foreach ($rows as $row) {
                $map[$row->key] = json_decode($row->value, true);
            }
            return $map;
        });
    }

    /** Return only feature flags as a flat bool map. */
    public static function features(): array
    {
        $out = [];
        foreach (self::all() as $k => $v) {
            if (str_starts_with($k, 'feature.')) {
                $out[substr($k, 8)] = (bool) $v;
            }
        }
        return $out;
    }

    /**
     * Shortcut for code paths that need to check a single flag without
     * pulling the whole features() array. Falls back to true when the
     * key is unknown so a typo doesn't silently disable a surface.
     */
    public static function isFeatureEnabled(string $flag): bool
    {
        $features = self::features();
        return (bool) ($features[$flag] ?? true);
    }

    /** Return the flash-bar message + tone, or null when empty. */
    public static function flashBar(): ?array
    {
        $msg = self::get('flash.message');
        if (!$msg) return null;
        return [
            'message' => (string) $msg,
            'tone' => self::get('flash.tone') ?? 'info',
        ];
    }

    public static function maintenance(): array
    {
        $eta = self::get('maintenance.eta_at');
        return [
            'enabled' => (bool) self::get('maintenance.enabled'),
            'message' => (string) self::get('maintenance.message'),
            'eta_at' => $eta,
        ];
    }

    public static function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
