import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import CookieBanner from './Components/CookieBanner';

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
