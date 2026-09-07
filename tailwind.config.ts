import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette (TechConnect)
        ink: '#000000',
        paper: '#FFFFFF',
        cream: {
          DEFAULT: '#FFEBCF',
          200: '#FFDBC0',
          300: '#F6CCB2',
        },
        flame: {
          DEFAULT: '#FF511C', // primary orange-red
          400: '#FF6A3C',
          500: '#FF511C',
          600: '#FF3F20',
          700: '#DE3216',
        },
        crimson: {
          DEFAULT: '#A81313', // deep red accents
          600: '#A81313',
          700: '#871F0F',
        },
        amber: {
          DEFAULT: '#FFA009', // comet head / gold
        },
        // the desk the gazette sheet sits on, and the warm gray of its offset
        // "shadow plate" (a solid duplicate shape, not a blur)
        paperbg: '#EDE6DB',
        plateshadow: '#C9C6C0',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-montserrat)', 'var(--font-inter)', 'sans-serif'],
        // the printed gazette is a heavy geometric sans in italic, not a serif
        gazette: ['var(--font-montserrat)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 40px -12px rgba(168, 19, 19, 0.18)',
        glow: '0 0 40px -4px rgba(255, 81, 28, 0.55)',
      },
      backgroundImage: {
        'flame-gradient': 'linear-gradient(120deg, #FF511C 0%, #C42315 55%, #A81313 100%)',
        'flame-radial': 'radial-gradient(circle at 30% 30%, #FF511C 0%, #C42315 45%, #A81313 100%)',
        'fire-deep': 'linear-gradient(150deg, #FF511C -15%, #A81313 60%)',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'marquee': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 14s linear infinite',
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'marquee': 'marquee 32s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
