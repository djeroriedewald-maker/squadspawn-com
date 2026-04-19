import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
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
                // New light-theme tokens
                bone: {
                    50: '#F4F1EC',   // primary page background
                    100: '#EAE5DC',  // secondary surface / subtle hover
                    200: '#D6CFC2',  // strong borders
                },
                ink: {
                    500: '#6B6A72',  // muted body text
                    700: '#3A3740',  // body text
                    800: '#1E1B25',  // near-black, dark panels
                    900: '#14121A',  // primary text / darkest panels
                },
                neon: {
                    red: '#E6002E',        // primary accent
                    'red-deep': '#B3001F', // hover / active
                    'red-glow': '#FF003C', // for glow effects only
                },
                // Secondary accents — used for status, categories, gradients
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
