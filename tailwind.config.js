/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d8ecff',
          200: '#b7daff',
          300: '#84c0ff',
          400: '#4d9dff',
          500: '#287dff',
          600: '#0f5cf1',
          700: '#0a45c5',
          800: '#0d3b96',
          900: '#133977',
          DEFAULT: '#287dff',
        },
      },
      boxShadow: {
        card: '0 10px 35px -15px rgba(15, 92, 241, 0.35)',
      },
    },
  },
  plugins: [],
}
