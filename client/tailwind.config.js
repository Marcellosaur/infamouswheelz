/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: "#d41132",
        "background-light": "#f8f6f6",
        "background-dark": "#221013",
        "surface-dark": "#2f151b",
        "surface-highlight": "#482329",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
