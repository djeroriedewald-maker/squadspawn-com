<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SafeUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value)) {
            return;
        }

        // Must start with https://
        if (!str_starts_with($value, 'https://')) {
            $fail('The :attribute must be a secure (https) URL.');
            return;
        }

        // Block javascript:, data:, etc.
        if (preg_match('/^(javascript|data|vbscript|file):/i', $value)) {
            $fail('The :attribute contains an unsafe URL scheme.');
            return;
        }

        // Must have a valid host
        $host = parse_url($value, PHP_URL_HOST);
        if (!$host) {
            $fail('The :attribute is not a valid URL.');
            return;
        }

        // Block localhost/internal IPs
        if (in_array($host, ['localhost', '127.0.0.1', '0.0.0.0']) || str_starts_with($host, '192.168.') || str_starts_with($host, '10.')) {
            $fail('The :attribute cannot point to a local address.');
        }
    }
}
