<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SanitizeInput
{
    /**
     * Fields that should have HTML tags stripped for XSS prevention.
     */
    private const SANITIZE_FIELDS = [
        'title', 'body', 'bio', 'description', 'message',
        'requirements_note', 'comment', 'username', 'name',
    ];

    public function handle(Request $request, Closure $next)
    {
        $input = $request->all();
        $this->sanitize($input);
        $request->merge($input);

        return $next($request);
    }

    private function sanitize(array &$data): void
    {
        foreach ($data as $key => &$value) {
            if (is_array($value)) {
                $this->sanitize($value);
            } elseif (is_string($value) && in_array($key, self::SANITIZE_FIELDS)) {
                // Strip HTML tags but allow basic text
                $value = strip_tags($value);
                // Remove any remaining script-like patterns
                $value = preg_replace('/(javascript|on\w+)\s*:/i', '', $value);
            }
        }
    }
}
