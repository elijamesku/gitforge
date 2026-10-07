import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          light: "hsl(var(--foreground-light))",
          lighter: "hsl(var(--foreground-lighter))",
          muted: "hsl(var(--foreground-muted))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          100: "hsl(var(--surface-100))",
          200: "hsl(var(--surface-200))",
          300: "hsl(var(--surface-300))",
        },
        overlay: {
          DEFAULT: "hsl(var(--overlay))",
          hover: "hsl(var(--overlay-hover))",
        },
        border: {
          DEFAULT: "hsl(var(--border-default))",
          muted: "hsl(var(--border-muted))",
        },
        brand: {
          DEFAULT: "hsl(var(--brand))",
          muted: "hsl(var(--brand-muted))",
          subtle: "hsl(var(--brand-subtle))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          muted: "hsl(var(--destructive-muted))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          muted: "hsl(var(--warning-muted))",
        },
      },
      borderColor: {
        DEFAULT: "hsl(var(--border-default))",
      },
    },
  },
  plugins: [],
};

export default config;
