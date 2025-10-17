/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'contessa': {
          '50': '#fcf5f4',
          '100': '#f9eae7',
          '200': '#f5d9d3',
          '300': '#edbeb4',
          '400': '#e09989',
          '500': '#d17662',
          '600': '#c26b58',
          '700': '#9d4a38',
          '800': '#834031',
          '900': '#6e392e',
          '950': '#3a1c15',
        },
      }
    },
  },
  plugins: [],
};
