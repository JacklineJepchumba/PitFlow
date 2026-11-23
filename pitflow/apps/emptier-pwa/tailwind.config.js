/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        field: "#0f3d2e",
        leaf: "#2f7a5b",
        chalk: "#f4f1ea",
        sun: "#e8a54b",
      },
    },
  },
  plugins: [],
};
