/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brandViolet: "#7C3AED",
        brandCyan: "#06B6D4",
        brandEmerald: "#10B981",
        brandAmber: "#F59E0B",
        brandRed: "#EF4444",
      },
    },
  },
  plugins: [],
};
