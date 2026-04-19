<?php

namespace App\Services;

use League\CommonMark\Environment\Environment;
use League\CommonMark\Extension\Autolink\AutolinkExtension;
use League\CommonMark\Extension\CommonMark\CommonMarkCoreExtension;
use League\CommonMark\Extension\GithubFlavoredMarkdownExtension;
use League\CommonMark\MarkdownConverter;

/**
 * Converts user-submitted Markdown to safe HTML.
 *
 * Security posture:
 *   - Raw HTML is not allowed (html_input: 'strip') so users can't inject
 *     scripts or arbitrary tags.
 *   - Unsafe links (javascript:, data:) are dropped (allow_unsafe_links: false).
 *   - YouTube URLs are post-processed into sandboxed iframes so pasting
 *     a link auto-embeds the player.
 */
class MarkdownRenderer
{
    private MarkdownConverter $converter;

    public function __construct()
    {
        $environment = new Environment([
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
            'max_nesting_level' => 20,
        ]);

        $environment->addExtension(new CommonMarkCoreExtension());
        $environment->addExtension(new GithubFlavoredMarkdownExtension());
        $environment->addExtension(new AutolinkExtension());

        $this->converter = new MarkdownConverter($environment);
    }

    public function render(?string $markdown): string
    {
        if (blank($markdown)) return '';
        $html = (string) $this->converter->convert($markdown);
        return $this->embedYouTube($html);
    }

    /**
     * Post-process: replace auto-linked YouTube watch URLs with an
     * embedded iframe. Runs on the already-rendered HTML so we don't
     * need to plug into the CommonMark node tree.
     *
     * Matches: <a href="https://(www.)?youtube.com/watch?v=ID">...</a>
     *          <a href="https://youtu.be/ID">...</a>
     */
    private function embedYouTube(string $html): string
    {
        $pattern = '#<a [^>]*href="(?:https?://)?(?:www\.)?(?:youtube\.com/watch\?v=|youtu\.be/)([A-Za-z0-9_-]{11})[^"]*"[^>]*>[^<]*</a>#i';

        return preg_replace_callback($pattern, function ($m) {
            $id = $m[1];
            return '<div class="youtube-embed"><iframe '
                . 'src="https://www.youtube.com/embed/' . $id . '" '
                . 'title="YouTube video player" '
                . 'frameborder="0" '
                . 'loading="lazy" '
                . 'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '
                . 'allowfullscreen '
                . 'referrerpolicy="strict-origin-when-cross-origin" '
                . 'sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"></iframe></div>';
        }, $html) ?? $html;
    }
}
