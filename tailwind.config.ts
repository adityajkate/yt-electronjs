import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./src/renderer/src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        glow: 'var(--color-glow)',
        'accent-red': { bg: 'var(--color-accent-red-bg)', text: 'var(--color-accent-red-text)' },
        'accent-blue': { bg: 'var(--color-accent-blue-bg)', text: 'var(--color-accent-blue-text)' },
        'accent-green': { bg: 'var(--color-accent-green-bg)', text: 'var(--color-accent-green-text)' },
        'accent-yellow': { bg: 'var(--color-accent-yellow-bg)', text: 'var(--color-accent-yellow-text)' },
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Geist Sans"', '"Helvetica Neue"', 'system-ui', 'sans-serif'],
        serif: ['"Newsreader"', '"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', '"SF Mono"', '"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'card': '8px',
        'lg': '12px',
      },
      spacing: {
        'titlebar': '36px',
        'sidebar': '56px',
        'bottombar': '80px',
      },
      boxShadow: {
        'card': '0 0 0 1px var(--color-border)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.06)',
        'glass': '0 0 0 1px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.04)',
        'elevated': '0 8px 32px rgba(0,0,0,0.08)',
      },
      maxWidth: {
        'content': '42rem',
      },
      letterSpacing: {
        'tightest': '-0.04em',
        'tighter': '-0.02em',
        'wide': '0.02em',
        'wider': '0.05em',
        'widest': '0.1em',
      },
    },
  },
  plugins: [],
} satisfies Config
