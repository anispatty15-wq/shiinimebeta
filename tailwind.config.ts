import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/context/**/*.{ts,tsx}',
    './src/hooks/**/*.{ts,tsx}',
  ],
  // Safelist opacity modifiers used in @apply so JIT always generates them
  safelist: [
    { pattern: /^bg-(white|black|cyan|violet|pink|surface|border)\/(5|10|15|20|25|30|40|50|60|70|80)$/ },
    { pattern: /^(text|border)-(cyan|violet|pink|green|orange)-(400|500)\/(15|30|60)$/ },
    { pattern: /^bg-(cyan|violet|pink|green|orange|surface)-?(500|400)?\/(10|15|20)$/ },
  ],
  theme: {
    extend: {
      colors: {
        // ── App Surfaces ──────────────────────────────────
        bg:          '#0F0F12',
        surface:     '#1A1A22',
        'surface-2': '#22222E',
        border:      '#2A2A38',

        // ── Accents ───────────────────────────────────────
        // Defined as objects so Tailwind generates shade-based utilities
        // e.g. bg-cyan-DEFAULT, text-cyan-400, border-pink-500/30 etc.
        cyan: {
          DEFAULT: '#00E5FF',
          dark:    '#00B8CC',
          glow:    'rgba(0,229,255,0.25)',
          // Tailwind opacity-modifier compatible shades
          400: '#22D3EE',
          500: '#00E5FF',
        },
        violet: {
          DEFAULT: '#8A2BE2',
          light:   '#AA55FF',
          glow:    'rgba(138,43,226,0.25)',
          400: '#A78BFA',
          500: '#8A2BE2',
        },
        pink: {
          DEFAULT: '#E91E8C',
          hover:   '#C2176F',
          400: '#F472B6',
          500: '#E91E8C',
        },

        // ── Text ──────────────────────────────────────────
        primary:   '#F1F5F9',
        secondary: '#94A3B8',
        muted:     '#475569',

        // ── Status ────────────────────────────────────────
        ongoing:   '#22D3EE',
        completed: '#4ADE80',
        movie:     '#FB923C',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        app: '14px',
        card: '12px',
        pill: '999px',
      },

      boxShadow: {
        card:      '0 4px 24px rgba(0,0,0,0.5)',
        modal:     '0 24px 64px rgba(0,0,0,0.75)',
        'glow-c':  '0 0 20px rgba(0,229,255,0.3)',
        'glow-v':  '0 0 20px rgba(138,43,226,0.3)',
        nav:       '0 -1px 0 rgba(255,255,255,0.06)',
      },

      backgroundImage: {
        'card-overlay': 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 55%, transparent 100%)',
        'hero-overlay': 'linear-gradient(60deg, rgba(15,15,18,0.96) 0%, rgba(15,15,18,0.55) 55%, transparent 100%)',
        'accent-grad':  'linear-gradient(135deg, #00E5FF 0%, #8A2BE2 100%)',
      },

      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.9)'  },
          to:   { opacity: '1', transform: 'scale(1)'    },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
      },

      animation: {
        shimmer:    'shimmer 1.8s infinite',
        'fade-up':  'fade-up 0.25s ease',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up': 'slide-up 0.3s ease',
      },
    },
  },
  plugins: [],
};

export default config;
