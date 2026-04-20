import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'auto' | 'light' | 'dark';

interface ThemeShared {
    preference: ThemePreference;
    authed: boolean;
}

function xsrf(): string | null {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

function systemPrefersDark(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolvedIsDark(pref: ThemePreference): boolean {
    if (pref === 'dark') return true;
    if (pref === 'light') return false;
    return systemPrefersDark();
}

function applyTheme(pref: ThemePreference) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedIsDark(pref));
    root.setAttribute('data-theme', pref);
}

/**
 * Theme state + setter. Reads the initial preference from the Inertia-shared
 * `theme` prop (server-side for authed users). On change it applies the class
 * synchronously, persists to localStorage, and — if logged in — PUTs the
 * server so the choice follows you across devices.
 */
export function useTheme() {
    const shared = (usePage().props as any).theme as ThemeShared | undefined;
    const authed = !!shared?.authed;
    const serverPref = shared?.preference ?? 'auto';

    const [preference, setPreferenceState] = useState<ThemePreference>(() => {
        if (typeof window === 'undefined') return serverPref;
        if (authed) return serverPref;
        try {
            const stored = localStorage.getItem('theme') as ThemePreference | null;
            if (stored === 'auto' || stored === 'light' || stored === 'dark') return stored;
        } catch {
            // ignore
        }
        return serverPref;
    });

    // Watch system preference so "Auto" updates live when the OS flips.
    useEffect(() => {
        if (preference !== 'auto') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('auto');
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [preference]);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
        applyTheme(next);
        try {
            localStorage.setItem('theme', next);
        } catch {
            // ignore
        }
        if (authed) {
            const token = xsrf();
            fetch('/settings/theme', {
                method: 'PUT',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(token ? { 'X-XSRF-TOKEN': token } : {}),
                },
                body: JSON.stringify({ preference: next }),
            }).catch(() => {
                // localStorage still has it; ignore server errors.
            });
        }
    }, [authed]);

    return { preference, setPreference };
}
