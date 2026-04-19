/**
 * Cookie consent state — single source of truth for both the banner and any
 * code that needs to check whether it's allowed to set non-essential cookies
 * or load analytics/ads scripts.
 *
 * Categories:
 *   functional — always true. Session, CSRF and consent itself.
 *   analytics  — off by default, opt-in.
 *   marketing  — off by default, opt-in.
 */

const STORAGE_KEY = 'cookie_consent_v2';
const CHANGE_EVENT = 'cookie-consent-change';

export interface Consent {
    functional: true;
    analytics: boolean;
    marketing: boolean;
    decidedAt: string; // ISO
}

export function getConsent(): Consent | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (typeof parsed !== 'object' || !parsed?.decidedAt) return null;
        return {
            functional: true,
            analytics: Boolean(parsed.analytics),
            marketing: Boolean(parsed.marketing),
            decidedAt: String(parsed.decidedAt),
        };
    } catch {
        return null;
    }
}

export function saveConsent(partial: { analytics: boolean; marketing: boolean }): void {
    const consent: Consent = {
        functional: true,
        analytics: !!partial.analytics,
        marketing: !!partial.marketing,
        decidedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: consent }));
}

export function clearConsent(): void {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: null }));
}

export function hasDecided(): boolean {
    return getConsent() !== null;
}

export function allows(category: 'analytics' | 'marketing'): boolean {
    const c = getConsent();
    if (!c) return false;
    return c[category];
}

/**
 * Subscribe to consent changes — useful for analytics libs that want to
 * boot/teardown when the user flips a toggle.
 */
export function onConsentChange(handler: (consent: Consent | null) => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent).detail ?? null);
    window.addEventListener(CHANGE_EVENT, listener);
    return () => window.removeEventListener(CHANGE_EVENT, listener);
}
