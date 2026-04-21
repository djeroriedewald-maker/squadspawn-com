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

        if (!str_starts_with($value, 'https://')) {
            $fail('The :attribute must be a secure (https) URL.');
            return;
        }

        if (preg_match('/^(javascript|data|vbscript|file):/i', $value)) {
            $fail('The :attribute contains an unsafe URL scheme.');
            return;
        }

        $host = parse_url($value, PHP_URL_HOST);
        if (!$host) {
            $fail('The :attribute is not a valid URL.');
            return;
        }

        // Strip IPv6 brackets so filter_var can validate the address.
        $host = trim($host, '[]');

        // Reject obvious local hostnames.
        if (in_array(strtolower($host), ['localhost', 'localhost.localdomain'], true)) {
            $fail('The :attribute cannot point to a local address.');
            return;
        }

        // Resolve + reject private/reserved ranges (IPv4 + IPv6). Covers
        // 127/8, 10/8, 172.16/12, 192.168/16, 169.254/16 link-local, ::1
        // loopback, fc00::/7 ULA, fe80::/10 link-local, and the AWS/GCP
        // metadata address 169.254.169.254. SSRF defence-in-depth even
        // though today we only embed client-side — next iteration might
        // server-fetch for unfurls.
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            if (!filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                $fail('The :attribute cannot point to a local address.');
            }
        }
    }
}
