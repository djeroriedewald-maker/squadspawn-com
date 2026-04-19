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
                `inline-flex items-center rounded-lg border border-neon-red/30 bg-neon-red px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-glow-red transition duration-150 ease-in-out hover:bg-neon-red/80 hover:shadow-lg hover:shadow-neon-red/30 focus:bg-neon-red/80 focus:outline-none focus:ring-2 focus:ring-neon-red focus:ring-offset-2 focus:ring-offset-bone-50 active:bg-neon-red/90 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
