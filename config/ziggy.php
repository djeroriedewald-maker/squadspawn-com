<?php

return [
    // Override Ziggy's default inline-script renderer with our own that
    // also assigns Ziggy to globalThis. See app/Support/Ziggy/GlobalScript.php
    // for the why — short version: Ziggy v2's `const Ziggy = {...}` is
    // block-scoped, so any other script reading bare `Ziggy` throws
    // ReferenceError unless we expose it on the global object.
    'output' => [
        'script' => \App\Support\Ziggy\GlobalScript::class,
    ],
];
