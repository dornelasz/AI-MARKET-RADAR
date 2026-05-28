import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a0b0f",
          subtle: "#0f1117",
          raised: "#141720",
          overlay: "#1a1e2a",
        },
        line: {
          subtle: "#1e2330",
          DEFAULT: "#262c3b",
        },
        brand: {
          DEFAULT: "#5b8cff",
          muted: "#3a5bbf",
          soft: "#1a2747",
        },
        accent: {
          green: "#3ddc97",
          amber: "#f5a623",
          red: "#ff6b6b",
          violet: "#a78bfa",
        },
        ink: {
          DEFAULT: "#e6e9f0",
          muted: "#9aa3b6",
          faint: "#5c6577",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.25)",
        glow: "0 0 0 1px rgba(91,140,255,0.25), 0 8px 32px rgba(91,140,255,0.12)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
