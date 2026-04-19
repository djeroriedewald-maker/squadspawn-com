import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function ResponsiveNavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active?: boolean }) {
    return (
        <Link
            {...props}
            className={`flex w-full items-start border-l-4 py-2 pe-4 ps-3 ${
                active
                    ? 'border-neon-red bg-neon-red/10 text-neon-red focus:border-neon-red focus:bg-neon-red/20'
                    : 'border-transparent text-ink-500 hover:border-neon-red/50 hover:bg-bone-100 hover:text-ink-900 focus:border-neon-red/50 focus:bg-bone-100 focus:text-ink-900'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
