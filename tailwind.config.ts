import type { Config } from "tailwindcss";

const brand = {
  50: "#FFF1F1",
  100: "#FFE3E0",
  200: "#FFC9C4",
  300: "#FF9E94",
  400: "#FF6B55",
  500: "#E4002B",
  600: "#C2002B",
  700: "#9C0027",
  800: "#75001F",
  900: "#520019",
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: brand,
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#171717",
        },
        paper: {
          DEFAULT: "#F3F0EA",
          deep: "#E8E3D8",
        },
        lime: {
          DEFAULT: "#D9F24A",
          dark: "#B7CE2E",
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
          "Anton",
          "Impact",
          "Haettenschweiler",
          "Arial Narrow Bold",
          "sans-serif",
        ],
        body: [
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
        drop: "0.04em",
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
