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
          950: '#061325',
          900: '#0B1E33',
          800: '#102A43',
          700: '#1E3A5F',
          600: '#2D4D75',
          500: '#486581',
          100: '#D9E2EC',
          50: '#F0F4F8',
        },
        medblue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        brandbg: '#F5F7FB',
        emergency: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
          light: '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
