/** @type {import('tailwindcss').Config} */
export const content = ['./src/**/*.{js,jsx,ts,tsx}'];
export const theme = {
    extend: {
        colors: {
            primary: 'var(--color-primary)',
            secondary: 'var(--color-secondary)',
            tertiary: 'var(--color-tertiaty)',
            background: '#f9f9f9',
            border: '#e5e7eb',
        },
    },
};
export const plugins = [];