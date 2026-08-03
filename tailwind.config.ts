import type { Config } from "tailwindcss";

const brand = {
  50: "#FBF7EF",
  100: "#F5ECDA",
  200: "#EAD7B1",
  300: "#DFC189",
  400: "#D4AC63",
  500: "#C99A45",
  600: "#B0802F",
  700: "#8C6526",
  800: "#6C4E22",
  900: "#57401E",
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
      },
      letterSpacing: {
        editorial: "0.12em",
        overline: "0.18em",
      },
      maxWidth: {
        page: "1440px",
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
