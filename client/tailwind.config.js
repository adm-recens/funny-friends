/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'poker-green': '#0f380f',
        'poker-green-dark': '#0a260a',
        'poker-felt': '#35654d',
        'gold-400': '#fbbf24',
        'gold-500': '#f59e0b',
        'gold-600': '#d97706',
        'card-red': '#ef4444',
        'card-black': '#1f2937',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        poker: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'chip': '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.3)',
      }
    },
  },
  plugins: [],
}
