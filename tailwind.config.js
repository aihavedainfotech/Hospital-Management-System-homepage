/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'blue-primary': '#14B8A6',
        'blue-dark': '#0F766E',
        'blue-mid': '#0F766E',
        'blue-light': '#ECFEFF',
        'blue-icon': '#CCFBF1',
        'navy-dark': '#0F2D52',
        'navy': '#163B65',
        'teal-primary': '#14B8A6',
        'teal-light': '#DFF7F4',
        'bg-light': '#F8FFFE',
        'text-dark': '#1E293B',
        'text-light': '#64748B',
        'accent-cyan': '#06B6D4',
      }
    },
  },
  plugins: [],
}
