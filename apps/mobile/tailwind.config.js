/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,ts,tsx}', './components/**/*.{js,ts,tsx}', './templates/**/*.{js,ts,tsx}'],

  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        Interbold: ['Interbold', 'Opensans'],
        Inter: ['Inter', 'Opensans' ],
      },
    },
  },
  plugins: [],
};
