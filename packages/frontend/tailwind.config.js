/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'spotter': {
          'dark': '#0A2233',
          'medium': '#1A4D63',
          'accent': '#FF3B4E',
          'light': '#E8EDF0',
        },
      },
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
        'spotter-pulse': 'spotterPulse 2s infinite',
        'float': 'float 3s ease-in-out infinite',
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
        spotterPulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(255, 59, 78, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(255, 59, 78, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255, 59, 78, 0)' },
        },
        float: {
          '0%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
          '100%': { transform: 'translateY(0px)' },
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