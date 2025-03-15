/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981',
        accent: '#6366F1',
        dark: {
          DEFAULT: '#0F172A',
          lighter: '#1E293B',
          light: '#334155',
        },
      },
      blur: {
        '3xl': '64px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyAQAAAAA2RLUcAAAAAnRSTlMAAHaTzTgAAAAZSURBVHgBYwAB/////w8GBgYGBqawIgDpiwl/vK4ElAAAAABJRU5ErkJggg==')",
      },
      backgroundColor: {
        'dark': '#0D1117',
      }
    },
  },
  plugins: [],
}