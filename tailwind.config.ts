import type { Config } from "tailwindcss";

const brand = {
  50: "#F7F7F7",
  100: "#F0F0F0",
  200: "#E5E5E5",
  300: "#D4D4D4",
  400: "#9C9C9C",
  500: "#161616",
  600: "#0A0A0A",
  700: "#000000",
  800: "#000000",
  900: "#000000",
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: brand,
        ink: {
          DEFAULT: "#0C0C0C",
          soft: "#171717",
        },
        paper: {
          DEFAULT: "#F3F0E9",
          deep: "#E8E4DA",
        },
        accent: {
          50: "#FBF6EC",
          100: "#F5EBD3",
          200: "#EBD9A8",
          300: "#DEC276",
          400: "#D0A94E",
          500: "#B98A2E",
          600: "#96702A",
          700: "#755625",
          800: "#5A4120",
          900: "#402E18",
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
