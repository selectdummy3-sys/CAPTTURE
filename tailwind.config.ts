import type { Config } from "tailwindcss";

const gold = {
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
  950: "#2B1D0D",
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
        brand: gold,
        neutral: stone,
        ink: {
          DEFAULT: "#0C0A09",
          soft: "#1C1917",
        },
        paper: {
          DEFAULT: "#F3F0E9",
          deep: "#E8E3D8",
        },
        accent: gold,
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
