import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-lg border border-gaming-purple/30 bg-gaming-purple px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-glow-purple transition duration-150 ease-in-out hover:bg-gaming-purple/80 hover:shadow-lg hover:shadow-gaming-purple/30 focus:bg-gaming-purple/80 focus:outline-none focus:ring-2 focus:ring-gaming-purple focus:ring-offset-2 focus:ring-offset-navy-900 active:bg-gaming-purple/90 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
