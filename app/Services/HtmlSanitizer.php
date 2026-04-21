<?php

namespace App\Services;

use DOMDocument;
use DOMElement;
use DOMXPath;

/**
 * Tiny HTML sanitiser for Tiptap output — no external dependencies, no
 * cache, straight DOMDocument. Whitelists exactly the tags + attributes
 * we allow in community post bodies. Drops everything else. Iframes are
 * only kept if their src matches the safe-embed hosts.
 */
class HtmlSanitizer
{
    /** tag => list of allowed attributes. Tags not in the map are unwrapped. */
    private const ALLOWED = [
        'p'          => [],
        'br'         => [],
        'strong'     => [],
        'b'          => [],
        'em'         => [],
        'i'          => [],
        'u'          => [],
        's'          => [],
        'a'          => ['href', 'title'],
        'ul'         => [],
        'ol'         => [],
        'li'         => [],
        'h2'         => [],
        'h3'         => [],
        'blockquote' => [],
        'code'       => [],
        'pre'        => [],
        'img'        => ['src', 'alt', 'width', 'height'],
        'iframe'     => ['src', 'width', 'height', 'allowfullscreen', 'frameborder'],
    ];

    private const IFRAME_HOSTS = '#^https?://(www\.youtube(?:-nocookie)?\.com/embed/|player\.vimeo\.com/video/)#i';
    private const URL_SCHEMES_OK = ['http', 'https', 'mailto'];

    public function sanitize(string $html): string
    {
        if (trim($html) === '') return '';

        // Wrap in a container so DOMDocument has a single root + utf-8.
        // We use a marker class so we can skip the wrapper during the
        // sanitise loop — otherwise our own whitelist unwraps it and
        // destroys the document.
        $wrapped = '<?xml encoding="UTF-8"?><div data-sanitize-root="1">' . $html . '</div>';

        $dom = new DOMDocument('1.0', 'UTF-8');
        $dom->preserveWhiteSpace = true;
        $dom->formatOutput = false;

        $prev = libxml_use_internal_errors(true);
        $dom->loadHTML($wrapped, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);

        $xpath = new DOMXPath($dom);
        // Only iterate elements INSIDE the wrapper, not the wrapper itself.
        $nodes = iterator_to_array($xpath->query('//*[not(@data-sanitize-root)]') ?: []);

        foreach ($nodes as $node) {
            if (!$node instanceof DOMElement) continue;
            $tag = strtolower($node->nodeName);

            if (!array_key_exists($tag, self::ALLOWED)) {
                $this->unwrap($node);
                continue;
            }

            // Strip any attribute that isn't whitelisted for this tag.
            $allowed = self::ALLOWED[$tag];
            foreach (iterator_to_array($node->attributes) as $attr) {
                if (!in_array(strtolower($attr->nodeName), $allowed, true)) {
                    $node->removeAttribute($attr->nodeName);
                }
            }

            // URL validation on href / src.
            if ($tag === 'a' && $node->hasAttribute('href')) {
                if (!$this->isSafeUrl($node->getAttribute('href'))) {
                    $node->removeAttribute('href');
                }
                $node->setAttribute('target', '_blank');
                $node->setAttribute('rel', 'noopener nofollow');
            }
            if ($tag === 'img') {
                $src = $node->getAttribute('src');
                if (!$src || !$this->isSafeUrl($src)) {
                    $node->parentNode?->removeChild($node);
                }
            }
            if ($tag === 'iframe') {
                $src = $node->getAttribute('src');
                if (!$src || !preg_match(self::IFRAME_HOSTS, $src)) {
                    $node->parentNode?->removeChild($node);
                } else {
                    $node->setAttribute('allowfullscreen', 'true');
                    $node->setAttribute('frameborder', '0');
                }
            }
        }

        // Serialise the inner contents of the wrapper div (find by marker).
        $rootList = $xpath->query('//div[@data-sanitize-root="1"]');
        $root = $rootList?->item(0);
        if (!$root instanceof DOMElement) return '';

        $html = '';
        foreach ($root->childNodes as $child) {
            $html .= $dom->saveHTML($child);
        }
        return trim($html);
    }

    /** Replace a node with its own children (drop the element, keep the text/inline). */
    private function unwrap(DOMElement $node): void
    {
        $parent = $node->parentNode;
        if (!$parent) return;
        while ($node->firstChild) {
            $parent->insertBefore($node->firstChild, $node);
        }
        $parent->removeChild($node);
    }

    private function isSafeUrl(string $url): bool
    {
        $url = trim($url);
        if ($url === '') return false;
        // Protocol-relative URLs are fine (assume https).
        if (str_starts_with($url, '//')) return true;
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));
        return in_array($scheme, self::URL_SCHEMES_OK, true);
    }
}
