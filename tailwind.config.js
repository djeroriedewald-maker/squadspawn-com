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
                navy: {
                    950: '#06080F',
                    900: '#0A0E1A',
                    800: '#121829',
                    700: '#1C2438',
                    600: '#283248',
                },
                gaming: {
                    purple: '#8B5CF6',
                    green: '#10B981',
                    pink: '#F472B6',
                    cyan: '#22D3EE',
                    orange: '#F59E0B',
                },
            },
            boxShadow: {
                'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
                'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
                'glow-pink': '0 0 20px rgba(244, 114, 182, 0.3)',
                'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.3)',
            },
        },
    },

    plugins: [forms],
};
