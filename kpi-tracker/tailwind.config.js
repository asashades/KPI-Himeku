/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'host-live': '#8B5CF6',
        'warehouse': '#F59E0B',
        'crewstore': '#10B981',
      },
    },
  },
  plugins: [],
}
