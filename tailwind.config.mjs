/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
      },
      colors: {
        dark: {
          DEFAULT: '#0f172a',
          lighter: '#1e293b',
          card: '#1a2744',
        },
        accent: {
          blue: '#3b82f6',
          cyan: '#06b6d4',
        },
      },
    },
  },
  plugins: [],
};
