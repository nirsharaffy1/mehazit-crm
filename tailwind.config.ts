import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#c6a15b", bright: "#e6c986", muted: "#a07d3a" },
        cream: "#f3ede0",
        offwhite: "#fbf9f4",
        dark: {
          DEFAULT: "#0a0a09",
          soft: "#131210",
          panel: "#161510",
          panel2: "#1b1a13",
          sidebar: "#100f0e",
        },
        line: "rgba(198,161,91,0.18)",
        "line-strong": "rgba(198,161,91,0.34)",
      },
      fontFamily: {
        display: ["var(--font-frank-ruhl)", "serif"],
        body: ["var(--font-heebo)", "sans-serif"],
      },
      borderRadius: { xl2: "12px" },
      boxShadow: {
        gold: "0 0 0 2px rgba(198,161,91,0.4)",
        card: "0 1px 3px rgba(0,0,0,0.08)",
        "card-dark": "0 1px 3px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
