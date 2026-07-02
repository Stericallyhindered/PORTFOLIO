/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          surface: '#151515',
          surface2: '#1f1f1f',
          border: '#2a2a2a',
          text: '#e5e5e5',
          text2: '#a3a3a3',
          accent: '#DC2626', // Red
          accentHover: '#B91C1C', // Darker red
          success: '#DC2626', // Red (was green)
          warning: '#EF4444', // Medium red (was yellow)
          error: '#B91C1C', // Darker red
        }
      }
    },
  },
  plugins: [],
}

