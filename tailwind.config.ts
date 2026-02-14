import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-geist-sans)", "system-ui"],
      },
      colors: {
        tarro: {
          50: "#fdf8f3",
          100: "#f9ede0",
          200: "#f2d9bd",
          300: "#e8bf8f",
          400: "#dda262",
          500: "#d48942",
          600: "#c67038",
          700: "#a4552f",
          800: "#84452c",
          900: "#6b3a27",
          950: "#391c12",
        },
        espresso: {
          50: "#f6f4f0",
          100: "#e8e2d8",
          200: "#d4c9b8",
          300: "#bcaa90",
          400: "#a88f6e",
          500: "#9b7d5d",
          600: "#8b6a51",
          700: "#735544",
          800: "#5f473b",
          900: "#4f3c33",
          950: "#2a1f1a",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;
