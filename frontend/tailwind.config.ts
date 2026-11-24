import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'Menlo', 'monospace'],
      },
      colors: {
        navy: {
          DEFAULT: '#17243A',
          hover: '#1F3150',
          active: '#243A5E',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          soft: '#EFF4FF',
        },
        surface: '#FFFFFF',
        bg: '#F6F7F9',
        text: {
          DEFAULT: '#202938',
          muted: '#64748B',
          'on-navy': '#E2E8F0',
          'on-navy-muted': '#94A3B8',
        },
        border: '#E5E7EB',
        line: '#E5E7EB',
        success: {
          DEFAULT: '#15803D',
          soft: '#ECFDF3',
        },
        warning: {
          DEFAULT: '#D97706',
          dark: '#92400E',
          soft: '#FFF7E6',
        },
        danger: {
          DEFAULT: '#DC2626',
          dark: '#B91C1C',
          soft: '#FEF2F2',
        },
        neutral: {
          soft: '#F1F5F9',
        },
        info: {
          DEFAULT: '#1D4ED8',
          soft: '#EFF4FF',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        modal: '0 8px 32px rgba(0,0,0,0.16)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
} satisfies Config
