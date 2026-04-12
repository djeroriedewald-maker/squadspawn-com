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
                    ? 'border-gaming-purple bg-gaming-purple/10 text-white focus:border-gaming-purple focus:bg-gaming-purple/20'
                    : 'border-transparent text-gray-400 hover:border-gaming-purple/50 hover:bg-navy-700 hover:text-white focus:border-gaming-purple/50 focus:bg-navy-700 focus:text-white'
            } text-base font-medium transition duration-150 ease-in-out focus:outline-none ${className}`}
        >
            {children}
        </Link>
    );
}
