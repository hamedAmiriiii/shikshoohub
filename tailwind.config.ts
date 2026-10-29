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
        felt: {
          50: "#eef7f1",
          100: "#d5ebdd",
          200: "#add7bc",
          300: "#7bbc95",
          400: "#4f9a70",
          500: "#347d56",
          600: "#266444",
          700: "#1f5038",
          800: "#1a402e",
          900: "#153526",
          950: "#0b1e16",
        },
        cue: {
          400: "#d4a574",
          500: "#c4894a",
          600: "#a66c35",
        },
      },
    },
  },
  plugins: [],
};
export default config;
