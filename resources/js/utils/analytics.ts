/**
 * Consent-gated analytics loader.
 *
 * Supports Plausible (privacy-first, no cookies) and Google Analytics 4.
 * Scripts load only while consent.analytics === true. Flipping the toggle
 * off unloads them and, for GA, sets consent signals so no further events
 * are dispatched.
 *
 * Configure via Vite env vars:
 *   VITE_PLAUSIBLE_DOMAIN  — your domain on Plausible (e.g. "squadspawn.com")
 *   VITE_PLAUSIBLE_SRC     — optional custom script src
 *   VITE_GA_ID             — Google Analytics 4 measurement ID (e.g. "G-XXXXX")
 */
import { allows, getConsent, onConsentChange } from './cookieConsent';

const SCRIPT_ID = 'squadspawn-analytics';
const GA_ID_KEY = 'squadspawn-ga-id';

declare global {
    interface Window {
        // Plausible queues calls under this name if the script is deferred
        plausible?: (event: string, opts?: Record<string, unknown>) => void;
        // Google Analytics
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

function injectScript(id: string, src: string, attrs: Record<string, string> = {}): void {
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.defer = true;
    Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
    document.head.appendChild(s);
}

function removeScripts(): void {
    document.querySelectorAll(`script[id^="${SCRIPT_ID}"]`).forEach((el) => el.remove());
}

function bootPlausible(): void {
    // Hostname-driven fallback so we don't depend on a build-time env var
    // being set. data-domain is public (visible in any page's HTML) so there's
    // no secret leak in defaulting it here.
    const envDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN;
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    // Don't track local dev or preview environments by default.
    const looksLikeProd = host === 'squadspawn.com' || host.endsWith('.squadspawn.com');

    const domain = envDomain
        ? String(envDomain)
        : (looksLikeProd ? 'squadspawn.com' : '');

    if (!domain) return;
    const src = import.meta.env.VITE_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js';
    injectScript(`${SCRIPT_ID}-plausible`, src, { 'data-domain': domain });
}

function bootGA(): void {
    const id = import.meta.env.VITE_GA_ID;
    if (!id) return;
    injectScript(`${SCRIPT_ID}-ga`, `https://www.googletagmanager.com/gtag/js?id=${id}`);
    (window as any)[GA_ID_KEY] = id;

    // Inline init — safe to run repeatedly.
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer!.push(arguments as unknown as unknown[]);
    };
    window.gtag('js', new Date());
    // Default-deny consent so GA doesn't set cookies until we explicitly grant.
    window.gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'granted',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
    });
    window.gtag('config', id, { anonymize_ip: true });
}

function unloadGA(): void {
    if (window.gtag) {
        // Revoke analytics storage — GA drops its cookies on next event.
        window.gtag('consent', 'update', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
        });
    }
}

function apply(): void {
    if (allows('analytics')) {
        bootPlausible();
        bootGA();
    } else {
        unloadGA();
        removeScripts();
    }
}

export function bootAnalytics(): void {
    if (typeof window === 'undefined') return;
    // Initial apply + subscribe to toggle changes
    // Delay once so we don't do any work before consent state is read from
    // localStorage on first paint.
    queueMicrotask(() => {
        if (getConsent()) apply();
    });
    onConsentChange(apply);
}
