/**
 * SquadSpawn service worker.
 *
 * Strategy:
 *   - HTML navigations: network-first, fall back to cached index on offline.
 *   - Vite-hashed assets under /build/: cache-first (content-hashed, safe to cache long).
 *   - Icons/images: cache-first with a soft TTL via versioning.
 *   - Everything else (APIs, Inertia partials, auth): pass through.
 *
 * Bump CACHE_VERSION to invalidate caches on deploy.
 */

const CACHE_VERSION = 'v7';
const STATIC_CACHE = `squadspawn-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `squadspawn-runtime-${CACHE_VERSION}`;

const OFFLINE_URL = '/';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) =>
            cache.addAll([
                '/favicon.svg',
                '/icons/icon-192.png',
                '/icons/icon-512.png',
            ]).catch(() => {})
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

function isAsset(url) {
    return url.pathname.startsWith('/build/')
        || url.pathname.startsWith('/icons/')
        || url.pathname.startsWith('/images/')
        || url.pathname.endsWith('.svg')
        || url.pathname === '/favicon.ico'
        || url.pathname === '/favicon.svg';
}

function isNavigation(request) {
    return request.mode === 'navigate'
        || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    // Skip Inertia partial requests (they carry X-Inertia header via fetch)
    // and anything under API-ish paths — let them hit the network untouched.
    if (request.headers.get('X-Inertia')) return;

    if (isNavigation(request)) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const copy = response.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
                    return response;
                })
                .catch(() =>
                    caches.match(request).then(
                        (cached) => cached || caches.match(OFFLINE_URL)
                    )
                )
        );
        return;
    }

    if (isAsset(url)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    const copy = response.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
                    return response;
                });
            })
        );
    }
});

// -----------------------------------------------------------------------------
// Web Push
// -----------------------------------------------------------------------------

self.addEventListener('push', (event) => {
    let payload = {};
    if (event.data) {
        try { payload = event.data.json(); } catch { payload = { title: event.data.text() }; }
    }

    const title = payload.title || 'SquadSpawn';
    const targetUrl = payload.url || '/';
    const options = {
        body: payload.body || '',
        icon: payload.icon || '/icons/icon-192.png',
        badge: payload.badge || '/icons/icon-192.png',
        image: payload.image,
        tag: payload.tag,         // coalesces notifications with the same tag
        data: {
            url: targetUrl,
            ...(payload.data || {}),
        },
        requireInteraction: !!payload.requireInteraction,
    };

    event.waitUntil((async () => {
        // Skip if any visible client is already on the target page (the chat
        // for this match, the LFG post, etc.). `visibilityState` is enough —
        // we don't require focus, because a backgrounded browser can still
        // show the user looking right at the chat.
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const matchingVisible = clients.find((c) => {
            if (c.visibilityState !== 'visible') return false;
            try {
                const url = new URL(c.url);
                return url.pathname === targetUrl || url.pathname.startsWith(targetUrl + '/');
            } catch { return false; }
        });

        if (matchingVisible) {
            matchingVisible.postMessage({ type: 'push', payload });
            return;
        }

        await self.registration.showNotification(title, options);
    })());
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url) || '/';

    event.waitUntil((async () => {
        const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

        // Prefer an existing PWA/tab on the same origin — focus it and
        // navigate to the target URL *inside* that window instead of
        // spawning a second PWA instance.
        for (const client of clientsList) {
            try {
                const url = new URL(client.url);
                if (url.origin !== self.location.origin) continue;

                if ('navigate' in client) {
                    await client.navigate(targetUrl).catch(() => {});
                    return client.focus();
                }
                // Fallback: postMessage so the app can router.visit() itself.
                client.postMessage({ type: 'navigate', url: targetUrl });
                return client.focus();
            } catch { /* ignore malformed */ }
        }

        if (self.clients.openWindow) {
            return self.clients.openWindow(targetUrl);
        }
    })());
});

// Browsers sometimes rotate or invalidate subscriptions; the service worker
// receives a `pushsubscriptionchange` event. Re-subscribe with the new one.
self.addEventListener('pushsubscriptionchange', (event) => {
    event.waitUntil((async () => {
        try {
            const cfg = await fetch('/push/config', { credentials: 'same-origin' }).then((r) => r.json()).catch(() => null);
            if (!cfg || !cfg.vapidPublicKey) return;

            const applicationServerKey = urlBase64ToUint8Array(cfg.vapidPublicKey);
            const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });

            await fetch('/push/subscribe', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify(sub.toJSON()),
            });
        } catch { /* best effort */ }
    })());
});

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    const output = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) output[i] = rawData.charCodeAt(i);
    return output;
}
