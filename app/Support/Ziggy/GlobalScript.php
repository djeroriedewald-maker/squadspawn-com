<?php

namespace App\Support\Ziggy;

use Stringable;
use Tighten\Ziggy\Ziggy;

/**
 * Mirrors Tighten\Ziggy\Output\Script, but also pins Ziggy on the global
 * scope. Ziggy v2's @routes renders `const Ziggy = {...}`, which is
 * block-scoped to its own <script> tag — any other inline script that
 * reads a bare `Ziggy` identifier blows up with ReferenceError. Setting
 * globalThis.Ziggy makes bare lookups resolve via the window/global
 * object and survives across script tags.
 */
class GlobalScript implements Stringable
{
    public function __construct(
        protected Ziggy $ziggy,
        protected string $function,
        protected string $nonce = '',
    ) {}

    public function __toString(): string
    {
        return <<<HTML
        <script type="text/javascript"{$this->nonce}>const Ziggy={$this->ziggy->toJson()};globalThis.Ziggy=Ziggy;{$this->function}</script>
        HTML;
    }
}
