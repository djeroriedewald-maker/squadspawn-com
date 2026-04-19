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

const CACHE_VERSION = 'v1';
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
