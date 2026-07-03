/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  corePlugins: {
    preflight: false, // don't reset existing app.css styles
    container: false,  // use the design's own .container (max-width 1240px) instead of Tailwind's 1536px one
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
        'cream-2': '#f4ecf6',
        ink: '#2c2336',
        'ink-soft': '#6b5f78',
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      // Design tokens ported from the custom CSS so migrated components stay
      // pixel-identical while going Tailwind-first.
      boxShadow: {
        glow: '0 8px 30px rgba(122,79,240,0.25)',
        'glow-lg': '0 16px 50px rgba(122,79,240,0.30)',
        card: '0 1px 3px rgba(46,39,64,.05), 0 1px 2px rgba(46,39,64,.04)',       // --shadow-sm
        soft: '0 2px 8px rgba(80,40,140,.05), 0 12px 32px rgba(80,40,140,.07)',   // --shadow-soft
        'glow-brand': '0 20px 50px rgba(166,79,214,.22)',                          // --shadow-glow
      },
      backgroundImage: {
        'grad-brand': 'linear-gradient(135deg, #a64fd6 0%, #8b63ef 55%, #7a4ff0 100%)', // --grad-brand
      },
      transitionTimingFunction: {
        brand: 'cubic-bezier(.22,.61,.36,1)', // --ease
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
