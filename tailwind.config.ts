import type { Config } from "tailwindcss";

const mono = {
  50: "#FFFFFF",
  100: "#F2F2F2",
  200: "#E5E5E5",
  300: "#CCCCCC",
  400: "#525252",
  500: "#111111",
  600: "#000000",
  700: "#000000",
  800: "#000000",
  900: "#000000",
  950: "#000000",
};

const stone = {
  50: "#FAFAF9",
  100: "#F5F5F4",
  200: "#E7E5E4",
  300: "#D6D3D1",
  400: "#A8A29E",
  500: "#78716C",
  600: "#57534E",
  700: "#44403C",
  800: "#292524",
  900: "#1C1917",
  950: "#0C0A09",
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: mono,
        neutral: stone,
        ink: {
          DEFAULT: "#000000",
          soft: "#1C1917",
        },
        paper: {
          DEFAULT: "#FFFFFF",
          deep: "#F2F2F2",
        },
        accent: mono,
        canvas: "#F4F4F6",
        royal: {
          DEFAULT: "#4F46E5",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Space Grotesk",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      letterSpacing: {
        editorial: "0.12em",
        overline: "0.18em",
      },
      maxWidth: {
        page: "1440px",
        1440: "1440px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
        "card-hover":
          "0 2px 4px rgba(0,0,0,0.06), 0 12px 32px rgba(0,0,0,0.10)",
        drawer: "-16px 0 40px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
