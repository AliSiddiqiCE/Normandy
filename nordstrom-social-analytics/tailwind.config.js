const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'instagram': '#bc2a8d',
        'tiktok': '#000000',
        'nordstrom-navy': {
          DEFAULT: '#0A2342', // Base navy color
          light: '#1E3A5F',   // Lighter shade for hover/accents
          dark: '#051424'     // Darker shade if needed
        },
        'nordstrom-black': '#191919',
        'nordstrom-blue': '#ff4c0c', // Updated to brand color #ff4c0c
        'nordstrom-orange': {
          DEFAULT: '#ff4c0c', // Primary brand color
          light: '#ff7a4c',   // Lighter shade for hover/accents
          dark: '#cc3d0a'     // Darker shade for active states
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
  darkMode: 'class', // Using class strategy for dark mode
}