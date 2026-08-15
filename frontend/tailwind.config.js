/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    /* Breakpoints: mobile <640 · tablet 640–1024 · desktop >1024
       sm = tablet start · lg = desktop chrome */
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        brand: {
          950: 'var(--sk-espresso)',
          900: 'var(--sk-brown-900)',
          800: 'var(--sk-brown-800)',
          700: 'var(--sk-brown-700)',
          600: 'var(--sk-brown-600)',
          500: 'var(--sk-brown-500)',
        },
        gold: {
          600: 'var(--sk-gold-600)',
          500: 'var(--sk-gold-500)',
          400: 'var(--sk-gold-400)',
          300: 'var(--sk-gold-300)',
        },
        cream: {
          100: 'var(--sk-cream-100)',
          200: 'var(--sk-cream-200)',
          300: 'var(--sk-cream-300)',
          400: 'var(--sk-cream-400)',
        },
        ink: {
          900: 'var(--sk-ink-900)',
          800: 'var(--sk-ink-800)',
          600: 'var(--sk-ink-600)',
          500: 'var(--sk-ink-500)',
          400: 'var(--sk-ink-400)',
        },
        line: 'var(--sk-line)',
        'line-strong': 'var(--sk-line-strong)',
      },
      fontFamily: {
        display: ['Playfair Display', 'ui-serif', 'Georgia', 'serif'],
        ui: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: '10px',
        xl: '14px',
        '2xl': '18px',
      },
      boxShadow: {
        'sk-sm': '0 1px 2px rgba(60,36,21,0.06)',
        'sk-md': '0 4px 14px rgba(60,36,21,0.08)',
        'sk-lg': '0 12px 32px rgba(60,36,21,0.12)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
