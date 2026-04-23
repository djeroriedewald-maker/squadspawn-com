import { ReactNode } from 'react';

interface Props {
    title: string;
    subtitle?: ReactNode;
    eyebrow?: string;
    image: string;
    /** Right-side actions (filters, CTAs) rendered below the copy on mobile, right on desktop. */
    actions?: ReactNode;
    /** Chip row rendered above the title (e.g. "Early access · Free"). */
    badges?: ReactNode;
    /** Height variant. `sm` for list pages, `md` for showcase pages. */
    size?: 'sm' | 'md';
}

/**
 * Shared page-header hero with a full-width image background, dark
 * gradient overlay, and centred copy. Used on Creators, LFG, Friends
 * and Achievements so those list pages don't feel like admin tables.
 */
export default function PageHero({
    title,
    subtitle,
    eyebrow,
    image,
    actions,
    badges,
    size = 'sm',
}: Props) {
    const heightClass = size === 'md' ? 'h-64 sm:h-72' : 'h-44 sm:h-48';

    return (
        <section className={`relative overflow-hidden ${heightClass}`}>
            <img
                src={image}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
            />
            {/* No overlay — the image stays as-is in both light + dark mode.
                Themed ink-*/bone-* tokens flip in dark theme and were making
                the overlay go pale. Text carries its own CSS drop-shadow so
                it stays legible directly on the image. */}

            <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center gap-3 px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0 flex-1">
                        {eyebrow && (
                            <p className="text-[11px] font-bold uppercase tracking-widest text-neon-red [text-shadow:_0_2px_8px_rgb(0_0_0_/_0.9)]">
                                {eyebrow}
                            </p>
                        )}
                        {badges && <div className="mt-1 flex flex-wrap items-center gap-2">{badges}</div>}
                        <h1 className="mt-1 text-2xl font-black text-white [text-shadow:_0_2px_12px_rgb(0_0_0_/_0.9)] sm:text-3xl lg:text-4xl">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-2 max-w-2xl text-sm text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_0.9)] sm:text-base">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
                </div>
            </div>
        </section>
    );
}
