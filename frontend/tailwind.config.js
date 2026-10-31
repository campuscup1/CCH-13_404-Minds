/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0F2942',
          900: '#1A365D',
          800: '#1E4273',
          700: '#25528C',
          600: '#2B6CB0',
          500: '#3182CE',
          100: '#E0F2FE',
          50: '#F0F9FF',
        },
        medblue: {
          50: '#F0F7FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0284C7',
          600: '#0369A1',
          700: '#075985',
        },
        brandbg: '#F0F6FF',
        emergency: {
          DEFAULT: '#0284C7',
          dark: '#0369A1',
          light: '#E0F2FE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
