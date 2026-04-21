import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import CookieBanner from './Components/CookieBanner';
import { bootAnalytics } from './utils/analytics';

bootAnalytics();

// Fallback: when the service worker can't navigate an existing PWA window
// directly (older iOS WebKit lacks Client.navigate()), it posts a navigate
// message and the already-running app routes itself. Without this the
// notification click ends up spawning a second PWA instance.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'navigate' && typeof event.data.url === 'string') {
            try {
                router.visit(event.data.url);
            } catch {
                window.location.href = event.data.url;
            }
        }
    });
}

const APP_NAME = 'SquadSpawn';

createInertiaApp({
    title: (title) => (title ? `${title} · ${APP_NAME}` : APP_NAME),
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <CookieBanner />
            </>
        );
    },
    progress: {
        color: '#E6002E',
    },
});
