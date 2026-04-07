/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sasa: {
          blue: '#003F87',
          darkblue: '#002D6B',
        },
      },
    },
  },
  plugins: [],
}

