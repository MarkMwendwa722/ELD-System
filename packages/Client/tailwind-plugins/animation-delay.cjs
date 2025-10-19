/**
 * This file contains JavaScript that helps set up and configure
 * the custom animation delay classes for Tailwind CSS
 */

const plugin = require('tailwindcss/plugin')

module.exports = plugin(function({ addUtilities }) {
  const animationDelays = {}
  
  // Generate animation delay utilities
  for (let i = 1; i <= 15; i++) {
    const delay = i * 100
    animationDelays[`.animation-delay-${delay}`] = {
      'animation-delay': `${delay}ms`,
    }
  }
  
  addUtilities(animationDelays)
})