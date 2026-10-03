/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        onyx: { DEFAULT: '#0a0a0a', 900: '#0a0a0a', 800: '#121212', 700: '#1a1a1a', 600: '#232323', 500: '#2e2e2e', 400: '#3d3d3d' },
        gold: { DEFAULT: '#d4af37', bright: '#ffd700', deep: '#a8862a', pale: '#f3e2a9', muted: '#8c7a45' },
        bone: '#f5f2ea',
      },
      fontFamily: {
        display: ['"Clash Display"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Switzer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { widest2: '0.32em' },
      boxShadow: {
        gold: '0 0 0 1px rgba(212,175,55,0.35), 0 10px 40px -10px rgba(212,175,55,0.35)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        sheen: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        sheen: 'sheen 6s linear infinite',
      },
    },
  },
  plugins: [],
};
