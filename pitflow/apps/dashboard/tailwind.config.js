/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Sans"', "system-ui", "sans-serif"],
        body: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#1a2e28",
        clay: "#c45c26",
        moss: "#2f6b4f",
        sand: "#e8efe9",
      },
    },
  },
  plugins: [],
};
