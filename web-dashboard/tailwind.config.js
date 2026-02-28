/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'indigo': {
          400: '#818cf8',
          500: '#6366f1',
        },
        'purple': {
          600: '#9333ea',
        },
        'gray': {
          400: '#9ca3af',
          500: '#6b7280',
        },
        'red': {
          400: '#f87171',
        },
      },
      fontFamily: {
        cinematic: ['Bebas Neue', 'Impact', 'Haettenschweiler', 'sans-serif'],
      },
      animation: {
        /* Phase 1 (0–0.6s): Fade in, scale 0.95→1 */
        'splash-phase1': 'splash-phase1 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        /* Phase 2 (0.6–2.2s): Subtle letter-spacing, slight brightness */
        'splash-phase2': 'splash-phase2 1.6s 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        /* Container: fade-out 2.2–2.8s, total 2.8s */
        'splash-container': 'splash-container 2.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        /* Phase 1: fade-in + zoom */
        'splash-phase1': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        /* Phase 2: subtle letter-spacing expansion, slight brightness — clean, no glow */
        'splash-phase2': {
          '0%': { letterSpacing: '-0.05em', filter: 'brightness(1)' },
          '100%': { letterSpacing: '0.06em', filter: 'brightness(1.04)' },
        },
        /* Container: fade-out at 78.5% (2.2s) */
        'splash-container': {
          '0%': { opacity: '1' },
          '78.5%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
