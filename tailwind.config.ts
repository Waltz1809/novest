import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import animate from "tailwindcss-animate";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      screens: {
        xs: "400px",
      },
      zIndex: {
        60: "60",
        70: "70",
        100: "100",
      },
      backgroundImage: {
        "noise-pattern":
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 8s linear infinite",
      },
    },
  },
  plugins: [
    animate,
    typography,
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".glow-amber": {
          boxShadow: "0 0 20px rgba(245, 158, 11, 0.3)",
        },
        ".glow-amber-strong": {
          boxShadow:
            "0 0 30px rgba(245, 158, 11, 0.5), 0 0 60px rgba(245, 158, 11, 0.2)",
        },
        ".glow-gold-text": {
          textShadow:
            "0 0 20px rgba(245, 158, 11, 0.4), 0 0 40px rgba(245, 158, 11, 0.2)",
        },
        ".custom-scrollbar::-webkit-scrollbar": {
          width: "6px",
        },
        ".custom-scrollbar::-webkit-scrollbar-track": {
          background: "rgba(11, 12, 16, 0.1)",
          borderRadius: "3px",
        },
        ".custom-scrollbar::-webkit-scrollbar-thumb": {
          background: "rgba(52, 211, 153, 0.3)",
          borderRadius: "3px",
        },
        ".custom-scrollbar::-webkit-scrollbar-thumb:hover": {
          background: "rgba(52, 211, 153, 0.5)",
        },
        ".dark .custom-scrollbar::-webkit-scrollbar-track": {
          background: "rgba(11, 12, 16, 0.5)",
        },
        ".scrollbar-hide::-webkit-scrollbar": {
          display: "none",
        },
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
      });
    }),
  ],
};
export default config;
