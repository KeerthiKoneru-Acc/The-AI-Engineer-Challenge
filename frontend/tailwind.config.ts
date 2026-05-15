import type { Config } from "tailwindcss";

/**
 * Tailwind theme aligned with `.cursor/rules/frontend-rule.mdc`.
 * Avoid default gray scale for surfaces and text.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0F1117",
        surface: "#1C1E26",
        border: "#2E3044",
        accent: "#7C6AF7",
        hint: "#4ECDC4",
        danger: "#FF6B6B",
        ink: "#F0F0F5",
        muted: "#8B8FA8",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "12px",
        control: "8px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0, 0, 0, 0.45)",
      },
      maxWidth: {
        chat: "800px",
      },
    },
  },
  plugins: [],
};

export default config;
