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
                    ? 'border-gaming-purple text-white focus:border-gaming-purple'
                    : 'border-transparent text-gray-400 hover:border-gaming-purple/50 hover:text-white focus:border-gaming-purple/50 focus:text-white') +
                ' ' +
                className
            }
        >
            {children}
        </Link>
    );
}
