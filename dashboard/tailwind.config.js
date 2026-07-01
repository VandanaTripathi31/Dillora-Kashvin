/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx}',
  ],
  corePlugins: {
    preflight: false, // don't reset existing app.css styles
  },
  theme: {
    extend: {
      colors: {
        // Dillora brand palette (from the logo)
        orchid: {
          50:  '#faf5fe',
          100: '#f3e9fb',
          200: '#e7d3f6',
          300: '#d4aeec',
          400: '#bd80e0',
          500: '#a64fd6', // primary
          600: '#8a39bd',
          700: '#6f2c98',
          800: '#4a1d68',
          900: '#321447',
        },
        violet: {
          400: '#8b63ef',
          500: '#7a4ff0', // accent
          600: '#6435d6',
        },
        cream: '#fdfbf7',
        ink: '#2c2336',
        'ink-soft': '#6b5f78',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 30px rgba(122,79,240,0.25)',
        'glow-lg': '0 16px 50px rgba(122,79,240,0.30)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
