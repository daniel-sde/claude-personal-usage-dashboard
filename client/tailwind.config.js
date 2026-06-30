/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0f1117',
          secondary: '#1a1d27',
          card: '#1e2130',
        },
        border: {
          DEFAULT: '#2d3148',
        },
        accent: {
          blue: '#4f8ef7',
          green: '#34d399',
          amber: '#fbbf24',
          purple: '#a78bfa',
          red: '#f87171',
        },
      },
    },
  },
  plugins: [],
}

