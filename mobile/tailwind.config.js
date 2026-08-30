/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#6E1126',
        'primary-light': '#8a1a33',
        secondary: '#283171',
        background: '#F3EFE6',
        foreground: '#2d2926',
        accent: '#714B9D',
        gold: '#EA9C33',
        coral: '#EE4731',
        'score-good': '#22c55e',
        'score-attention': '#f59e0b',
        'score-problem': '#ef4444',
        'card-bg': '#ffffff',
        border: '#e0dbd4',
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};
