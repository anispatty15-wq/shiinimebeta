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
        bg:          '#FFF7FA',
        surface:     '#FFFFFF',
        'surface-2': '#FFF0F5',
        border:      '#F3C4D5',

        // ── Accents ───────────────────────────────────────
        // Defined as objects so Tailwind generates shade-based utilities
        // e.g. bg-cyan-DEFAULT, text-cyan-400, border-pink-500/30 etc.
        cyan: {
          DEFAULT: '#E91E8C',
          dark:    '#BE185D',
          glow:    'rgba(233,30,140,0.25)',
          // Tailwind opacity-modifier compatible shades
          400: '#DB2777',
          500: '#E91E8C',
        },
        violet: {
          DEFAULT: '#BE185D',
          light:   '#DB2777',
          glow:    'rgba(190,24,93,0.25)',
          400: '#DB2777',
          500: '#BE185D',
        },
        pink: {
          DEFAULT: '#E91E8C',
          hover:   '#C2176F',
          400: '#F472B6',
          500: '#E91E8C',
        },

        // ── Text ──────────────────────────────────────────
        primary:   '#111827',
        secondary: '#374151',
        muted:     '#6B7280',

        // ── Status ────────────────────────────────────────
        ongoing:   '#DB2777',
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
        'glow-c':  '0 0 20px rgba(233,30,140,0.24)',
        'glow-v':  '0 0 20px rgba(190,24,93,0.24)',
        nav:       '0 -1px 0 rgba(190,24,93,0.12)',
      },

      backgroundImage: {
        'card-overlay': 'linear-gradient(to top, rgba(17,24,39,0.88) 0%, rgba(17,24,39,0.2) 55%, transparent 100%)',
        'hero-overlay': 'linear-gradient(60deg, rgba(255,247,250,0.96) 0%, rgba(255,247,250,0.55) 55%, transparent 100%)',
        'accent-grad':  'linear-gradient(135deg, #E91E8C 0%, #BE185D 100%)',
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

      // ── Safe Area Insets ──────────────────────────────
      padding: {
        safe: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
      margin: {
        safe: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-right': 'env(safe-area-inset-right)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }: any) {
      addUtilities({
        '.pt-safe': {
          'padding-top': 'env(safe-area-inset-top)',
        },
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.pl-safe': {
          'padding-left': 'env(safe-area-inset-left)',
        },
        '.pr-safe': {
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.px-safe': {
          'padding-left': 'env(safe-area-inset-left)',
          'padding-right': 'env(safe-area-inset-right)',
        },
        '.py-safe': {
          'padding-top': 'env(safe-area-inset-top)',
          'padding-bottom': 'env(safe-area-inset-bottom)',
        },
        '.mt-safe': {
          'margin-top': 'env(safe-area-inset-top)',
        },
        '.mb-safe': {
          'margin-bottom': 'env(safe-area-inset-bottom)',
        },
      });
    },
  ],
};

export default config;
