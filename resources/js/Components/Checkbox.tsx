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
                'rounded border-ink-900/20 bg-bone-100 text-neon-red shadow-sm focus:ring-neon-red ' +
                className
            }
        />
    );
}
