import { useTheme, ThemePreference } from '@/hooks/useTheme';

const OPTIONS: { value: ThemePreference; label: string; icon: JSX.Element }[] = [
    {
        value: 'auto',
        label: 'Auto',
        icon: (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <rect x="3" y="5" width="18" height="13" rx="2" />
                <path d="M8 21h8M12 18v3" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        value: 'light',
        label: 'Light',
        icon: (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        value: 'dark',
        label: 'Dark',
        icon: (
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" strokeLinejoin="round" />
            </svg>
        ),
    },
];

interface Props {
    /** Compact variant hides labels, showing only icons. */
    compact?: boolean;
    className?: string;
}

export default function ThemeToggle({ compact = false, className = '' }: Props) {
    const { preference, setPreference } = useTheme();

    return (
        <div
            role="radiogroup"
            aria-label="Theme"
            className={`inline-flex items-center gap-0.5 rounded-lg border border-ink-900/10 bg-bone-100 p-0.5 ${className}`}
        >
            {OPTIONS.map((opt) => {
                const active = preference === opt.value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setPreference(opt.value)}
                        title={opt.label}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold transition ${
                            active
                                ? 'bg-white text-ink-900 shadow-sm'
                                : 'text-ink-500 hover:text-ink-900'
                        }`}
                    >
                        {opt.icon}
                        {!compact && <span>{opt.label}</span>}
                    </button>
                );
            })}
        </div>
    );
}
