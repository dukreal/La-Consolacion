/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // PHP sends some colour classes as text (for example order status badges: "bg-yellow-100 text-yellow-800").
  // Tailwind only builds classes it can find in these source files, so we list the ones PHP can send.
  safelist: [
    {
      pattern: /^(bg|text|border)-(yellow|blue|purple|indigo|green|red|orange|gray)-(100|200|400|800)$/,
    },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
