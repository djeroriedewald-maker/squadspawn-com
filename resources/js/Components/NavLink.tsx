import { InertiaLinkProps, Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    ...props
}: InertiaLinkProps & { active: boolean }) {
    return (
        <Link
            {...props}
            className={
                'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium leading-5 transition duration-150 ease-in-out focus:outline-none ' +
                (active
                    ? 'border-neon-red text-ink-900 focus:border-neon-red'
                    : 'border-transparent text-ink-500 hover:border-neon-red/50 hover:text-ink-900 focus:border-neon-red/50 focus:text-ink-900') +
                ' ' +
                className
            }
        >
            {children}
        </Link>
    );
}
