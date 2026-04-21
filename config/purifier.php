<?php
/**
 * Ok, glad you are here
 * first we get a config instance, and set the settings
 * $config = HTMLPurifier_Config::createDefault();
 * $config->set('Core.Encoding', $this->config->get('purifier.encoding'));
 * $config->set('Cache.SerializerPath', $this->config->get('purifier.cachePath'));
 * if ( ! $this->config->get('purifier.finalize')) {
 *     $config->autoFinalize = false;
 * }
 * $config->loadArray($this->getConfig());
 *
 * You must NOT delete the default settings
 * anything in settings should be compacted with params that needed to instance HTMLPurifier_Config.
 *
 * @link http://htmlpurifier.org/live/configdoc/plain.html
 */

return [
    'encoding'           => 'UTF-8',
    'finalize'           => true,
    'ignoreNonStrings'   => false,
    'cachePath'          => storage_path('app/purifier'),
    'cacheFileMode'      => 0755,
    'settings'      => [
        'default' => [
            'HTML.Doctype'             => 'HTML 4.01 Transitional',
            'HTML.Allowed'             => 'div,b,strong,i,em,u,a[href|title],ul,ol,li,p[style],br,span[style],img[width|height|alt|src]',
            'CSS.AllowedProperties'    => 'font,font-size,font-weight,font-style,font-family,text-decoration,padding-left,color,background-color,text-align',
            'AutoFormat.AutoParagraph' => true,
            'AutoFormat.RemoveEmpty'   => true,
        ],
        // Richer preset for community post bodies — allows everything the
        // Tiptap StarterKit can produce without opening XSS risk. Images
        // and YouTube iframes are locked down via SafeIframe regex so only
        // embeddable video hosts slip through.
        //
        // Cache.DefinitionImpl => null skips the on-disk definition cache
        // so we don't fail if storage/app/purifier isn't writable on prod.
        // Render is still fast — the cost is a couple of ms per call.
        'community_post' => [
            'HTML.Doctype'             => 'HTML 4.01 Transitional',
            'HTML.Allowed'             => 'p,br,strong,b,em,i,u,s,a[href|target|rel|title],ul,ol,li,h2,h3,blockquote,code,pre,img[src|alt|width|height],iframe[src|width|height|allowfullscreen|frameborder]',
            'HTML.TargetBlank'         => true,
            'HTML.Nofollow'            => true,
            'HTML.SafeIframe'          => true,
            'URI.SafeIframeRegexp'     => '%^(https?:)?//(www\.youtube(?:-nocookie)?\.com/embed/|player\.vimeo\.com/video/)%',
            'AutoFormat.AutoParagraph' => true,
            'AutoFormat.RemoveEmpty'   => true,
            'URI.AllowedSchemes'       => ['http' => true, 'https' => true, 'mailto' => true, 'data' => false],
            'Cache.DefinitionImpl'     => null,
        ],
        'test'    => [
            'Attr.EnableID' => 'true',
        ],
        "youtube" => [
            "HTML.SafeIframe"      => 'true',
            "URI.SafeIframeRegexp" => "%^(http://|https://|//)(www.youtube.com/embed/|player.vimeo.com/video/)%",
        ],
    ],

];
