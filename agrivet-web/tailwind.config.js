/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9f0',
          100: '#dcf2dc',
          200: '#bce5bc',
          300: '#8fd28f',
          400: '#5cb85c',
          500: '#3d9c3d', // AgriVet green
          600: '#2f7f2f',
          700: '#276427',
          800: '#225022',
          900: '#1d421d',
        }
      }
    },
  },
  plugins: [],
}