/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease forwards',
        'slide-in-left': 'slideInLeft 0.6s ease forwards',
        'slide-in-right': 'slideInRight 0.6s ease forwards',
        'slide-in-up': 'fadeInUp 0.8s ease forwards',
        'pulse-once': 'pulseOnce 1.5s cubic-bezier(0.4, 0, 0.6, 1) forwards',
        'shake': 'shake 0.5s cubic-bezier(0.4, 0, 0.6, 1) forwards',
        'shimmer': 'shimmer 2s infinite',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'dash': 'dash 2s ease-in-out infinite',
        'bounce-delayed': 'bounce 1s infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseOnce: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        dash: {
          '0%': { strokeDashoffset: '100' },
          '50%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '100' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.animation-delay-200': { 'animation-delay': '200ms' },
        '.animation-delay-300': { 'animation-delay': '300ms' },
        '.animation-delay-400': { 'animation-delay': '400ms' },
        '.animation-delay-500': { 'animation-delay': '500ms' },
        '.animation-delay-600': { 'animation-delay': '600ms' },
        '.animation-delay-700': { 'animation-delay': '700ms' },
        '.animation-delay-800': { 'animation-delay': '800ms' },
        '.animation-delay-900': { 'animation-delay': '900ms' },
        '.animation-delay-1000': { 'animation-delay': '1000ms' },
        '.animation-delay-1100': { 'animation-delay': '1100ms' },
      }
      addUtilities(newUtilities, ['responsive'])
    }
  ],
}