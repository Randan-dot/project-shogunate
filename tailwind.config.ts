import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sumi: {
          950: "#110f1a",
          900: "#171422",
          800: "#1e1a2c",
          700: "#2a243c",
          600: "#3a3152",
        },
        washi: {
          50: "#faf6ee",
          100: "#f3ecdd",
          200: "#e7dcc4",
        },
        torii: {
          DEFAULT: "#d43b2a",
          600: "#c02a1c",
          500: "#d43b2a",
          400: "#e05545",
        },
        sakura: {
          DEFAULT: "#f7c9d3",
          200: "#fbe0e6",
          300: "#f7c9d3",
          400: "#f0a6b6",
        },
        matcha: {
          DEFAULT: "#9bbf8f",
          600: "#7fa873",
        },
        kin: {
          DEFAULT: "#d4af37",
          400: "#e6c65c",
        },
      },
      fontFamily: {
        display: ['"Shippori Mincho B1"', '"Noto Serif JP"', "serif"],
        body: ['"Zen Kaku Gothic New"', '"Noto Sans JP"', "sans-serif"],
      },
      keyframes: {
        "petal-fall": {
          "0%": {
            transform: "translateY(-10vh) translateX(0) rotate(0deg)",
            opacity: "0",
          },
          "10%": { opacity: "1" },
          "100%": {
            transform: "translateY(110vh) translateX(8vw) rotate(320deg)",
            opacity: "0.5",
          },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "petal-fall": "petal-fall linear infinite",
        "fade-up": "fade-up 0.6s ease-out both",
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
