/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        field: "#0f3d2e",
        leaf: "#3d8b6e",
        chalk: "#f3f7f4",
      },
    },
  },
  plugins: [],
};
