/**
 * Web Push subscription helpers. Browser-side half of the push pipeline.
 */

export type PushState = 'unsupported' | 'denied' | 'granted' | 'default';

export function isPushSupported(): boolean {
    return typeof window !== 'undefined'
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
}

export function currentPermission(): PushState {
    if (!isPushSupported()) return 'unsupported';
    const perm = Notification.permission;
    if (perm === 'granted') return 'granted';
    if (perm === 'denied') return 'denied';
    return 'default';
}

function urlBase64ToUint8Array(base64: string): BufferSource {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    const buffer = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < raw.length; ++i) view[i] = raw.charCodeAt(i);
    return view;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!isPushSupported()) return null;
    try {
        return await navigator.serviceWorker.ready;
    } catch {
        return null;
    }
}

export async function hasLocalSubscription(): Promise<boolean> {
    const reg = await getRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
}

/**
 * Ask the user for permission, create a browser subscription, and post it to
 * the server. Returns true on success.
 */
export async function enablePush(vapidPublicKey: string): Promise<boolean> {
    if (!isPushSupported()) return false;
    if (!vapidPublicKey) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const reg = await getRegistration();
    if (!reg) return false;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
        sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
    }

    const response = await authedFetch('/push/subscribe', 'POST', sub.toJSON());
    return response.ok;
}

export async function disablePush(): Promise<boolean> {
    const reg = await getRegistration();
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return true;

    const endpoint = sub.endpoint;
    await sub.unsubscribe().catch(() => {});
    await authedFetch('/push/subscribe', 'DELETE', { endpoint }).catch(() => {});
    return true;
}

async function authedFetch(url: string, method: string, body: unknown): Promise<Response> {
    const xsrf = getXsrfCookie();
    return fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
        },
        body: JSON.stringify(body),
    });
}

function getXsrfCookie(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}
