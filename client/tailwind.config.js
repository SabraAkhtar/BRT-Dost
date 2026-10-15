/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brt: {
          navy: '#0b192c',
          navyLight: '#1e3e62',
          teal: '#008170',
          tealLight: '#00a884',
          accent: '#ff6e31',
          slate: '#f8fafc',
          border: '#e2e8f0',
          verified: '#059669',
          unverified: '#d97706',
          stale: '#dc2626',
          unknown: '#64748b'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
