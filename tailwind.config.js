/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--color-canvas) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        line: 'rgb(var(--color-line) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--color-accent-ink) / <alpha-value>)',
        action: 'rgb(var(--color-action) / <alpha-value>)',
        'accent-soft': 'rgb(var(--color-accent-soft) / <alpha-value>)',
        'player-o': 'rgb(var(--color-player-o) / <alpha-value>)',
        'warm-soft': 'rgb(var(--color-warm-soft) / <alpha-value>)',
        positive: 'rgb(var(--color-positive) / <alpha-value>)',
        'positive-soft': 'rgb(var(--color-positive-soft) / <alpha-value>)',
        negative: 'rgb(var(--color-negative) / <alpha-value>)',
        'negative-soft': 'rgb(var(--color-negative-soft) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans'],
      },
    },
  },
  plugins: [],
};
