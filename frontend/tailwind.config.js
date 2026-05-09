/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00f0ff',
          pink: '#ff00e5',
          green: '#39ff14',
          yellow: '#f0ff00',
          purple: '#bf00ff',
        },
        cyber: {
          dark: '#0a0a1a',
          darker: '#050510',
          card: '#111128',
          border: '#1a1a3e',
        },
        suit: {
          chains: '#ef4444',
          virus: '#22c55e',
          wheel: '#3b82f6',
          bolt: '#eab308',
          eye: '#a855f7',
          mask: '#f97316',
          spiral: '#ec4899',
          alert: '#6b7280',
        },
      },
      fontFamily: {
        cyber: ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0, 240, 255, 0.5), 0 0 40px rgba(0, 240, 255, 0.2)',
        'neon-pink': '0 0 10px rgba(255, 0, 229, 0.5), 0 0 40px rgba(255, 0, 229, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
