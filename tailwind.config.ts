import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        /* felt/cue = اسکین وبینو برای بیلیارد (تیره + cyan/violet) */
        felt: {
          50: "#f1f5f9",
          100: "#e2e8f0",
          200: "#cbd5e1",
          300: "#94a3b8",
          400: "#64748b",
          500: "#64748b",
          600: "#94a3b8",
          700: "#cbd5e1",
          800: "#1e293b",
          900: "#0f172a",
          950: "#0b0f1a",
        },
        cue: {
          400: "#22d3ee",
          500: "#c026d3",
          600: "#a855f7",
        },
      },
    },
  },
  plugins: [],
};
export default config;
