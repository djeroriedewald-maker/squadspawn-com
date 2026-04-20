import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

// Colors are driven by CSS variables defined in resources/css/app.css.
// This lets the same utility class (e.g. `bg-white`, `text-ink-900`) flip
// between light and dark themes without rewriting every component.
// Alpha modifiers (`bg-white/80`) still work via the <alpha-value> syntax.
const themed = (v) => `rgb(var(${v}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // Themed surface + text tokens — values come from :root / .dark in app.css
                white: themed('--color-white'),
                bone: {
                    50: themed('--color-bone-50'),
                    100: themed('--color-bone-100'),
                    200: themed('--color-bone-200'),
                },
                ink: {
                    500: themed('--color-ink-500'),
                    700: themed('--color-ink-700'),
                    800: themed('--color-ink-800'),
                    900: themed('--color-ink-900'),
                },
                // Accents — identical in both themes
                neon: {
                    red: '#E6002E',
                    'red-deep': '#B3001F',
                    'red-glow': '#FF003C',
                },
                gaming: {
                    green: '#10B981',
                    pink: '#F472B6',
                    cyan: '#22D3EE',
                    orange: '#F59E0B',
                },
            },
            boxShadow: {
                'glow-red': '0 0 20px rgba(230, 0, 46, 0.35)',
                'glow-red-lg': '0 0 40px rgba(230, 0, 46, 0.4)',
                'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
                'glow-pink': '0 0 20px rgba(244, 114, 182, 0.3)',
                'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.3)',
            },
        },
    },

    plugins: [forms],
};
