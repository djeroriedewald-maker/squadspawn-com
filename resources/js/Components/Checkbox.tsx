import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-white/20 bg-navy-700 text-gaming-purple shadow-sm focus:ring-gaming-purple ' +
                className
            }
        />
    );
}
