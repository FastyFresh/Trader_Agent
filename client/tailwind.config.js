/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'trading': {
          primary: '#10B981',
          secondary: '#374151',
          accent: '#F59E0B',
          danger: '#EF4444',
          success: '#10B981',
          warning: '#F59E0B',
          info: '#3B82F6',
        },
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      screens: {
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
