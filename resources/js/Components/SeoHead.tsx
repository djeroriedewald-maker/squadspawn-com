import { Head, usePage } from '@inertiajs/react';

interface SeoProp {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
}

/**
 * Mirrors the server-side seo prop into client-side Head tags so the
 * browser title + og tags stay in sync during Inertia SPA navigation.
 * The blade template already renders the same values on first load
 * (that's what search crawlers index) — this component only matters
 * for in-app nav + share-button pickups after a client-side visit.
 */
export default function SeoHead({ fallbackTitle }: { fallbackTitle?: string }) {
    const seo = (usePage().props as { seo?: SeoProp }).seo;
    const title = seo?.title ?? fallbackTitle;
    const description = seo?.description;
    const image = seo?.image;

    if (!title && !description && !image) return null;

    return (
        <Head title={title}>
            {description && <meta name="description" content={description} />}
            {description && <meta property="og:description" content={description} />}
            {title && <meta property="og:title" content={title} />}
            {image && <meta property="og:image" content={image} />}
            {title && <meta name="twitter:title" content={title} />}
            {description && <meta name="twitter:description" content={description} />}
            {image && <meta name="twitter:image" content={image} />}
        </Head>
    );
}
