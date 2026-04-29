import { useEffect, useRef } from 'react';

/**
 * Persist an Inertia useForm `data` payload to localStorage so a closed
 * tab / dropped connection / accidental nav doesn't lose a half-filled
 * long form. Caller is responsible for hydrating on mount and clearing
 * on successful submit — we only handle the autosave half.
 *
 * Usage:
 *   const { data, setData } = useForm({ ... });
 *   useFormDraft('lfg-create', data);
 *   // and on first mount, optionally:
 *   //   const draft = loadFormDraft<typeof data>('lfg-create');
 *   //   if (draft) setData(draft);
 *   // on success: clearFormDraft('lfg-create');
 *
 * Throttled so we don't spam localStorage on every keystroke — 400ms is
 * plenty for "user paused typing" without losing data on tab close.
 */
export function useFormDraft<T extends Record<string, unknown>>(key: string, data: T): void {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            try {
                window.localStorage.setItem(`draft:${key}`, JSON.stringify(data));
            } catch {
                // localStorage can throw on quota / private mode — silent
                // fail is fine, autosave is best-effort.
            }
        }, 400);
        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [key, data]);
}

export function loadFormDraft<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(`draft:${key}`);
        if (!raw) return null;
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

export function clearFormDraft(key: string): void {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(`draft:${key}`);
    } catch {
        // ignore
    }
}
