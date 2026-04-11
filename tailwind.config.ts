import type { Config } from "tailwindcss";

const config: Config = {
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
          800: "#111111",
          700: "#1a1a1a",
          600: "#222222",
          500: "#333333",
          400: "#555555",
          300: "#888888",
        },
        aura: "#8b5cf6",
        volt: "#28d7ff",
        mint: "#46f2a5",
        signal: "#ff4d7d",
      },
      boxShadow: {
        glass: "0 18px 60px rgba(0,0,0,0.32)",
        glow: "0 0 32px rgba(40,215,255,0.18)",
        soft: "0 2px 8px rgba(0,0,0,0.4)",
      },
      animation: {
        lift: "lift 0.2s ease-out",
        shimmer: "shimmer 1.7s ease-in-out infinite",
      },
      keyframes: {
        lift: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
