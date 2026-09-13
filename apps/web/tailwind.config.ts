import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050505",
          900: "#0a0a0a",
          850: "#101010",
          800: "#171717",
          700: "#242424",
          500: "#707070",
          300: "#c8c8c8",
        },
        aura: "#8b5cf6",
        volt: "#28d7ff",
        mint: "#46f2a5",
        signal: "#ff4d7d",
      },
      boxShadow: {
        glass: "0 24px 80px rgba(15, 23, 42, 0.10)",
        glow: "0 0 0 1px rgba(15, 23, 42, 0.12), 0 22px 70px rgba(15, 23, 42, 0.08)",
        soft: "0 16px 50px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "Satoshi", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        lift: "lift 4s ease-in-out infinite",
        shimmer: "shimmer 1.7s ease-in-out infinite",
      },
      keyframes: {
        lift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-3px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-220% 0" },
          "100%": { backgroundPosition: "220% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
