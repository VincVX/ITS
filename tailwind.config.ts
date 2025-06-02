// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  //darkMode: ["class"], // THIS MUST BE HERE
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // Ensure all your component folders are covered
  ],
  theme: {
    container: { /* ... */ },
    extend: {
      colors: {
        // THESE MUST REFERENCE YOUR CSS VARIABLES
        background: "oklch(var(--background))", // Assuming your postcss setup correctly parses this
        foreground: "oklch(var(--foreground))",
        card: "oklch(var(--card))",
        "card-foreground": "oklch(var(--card-foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary))",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary))",
          foreground: "oklch(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted))",
          foreground: "oklch(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "oklch(var(--accent))",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring))",
        // Add chart and sidebar colors here if you use them in Tailwind classes
        "chart-1": "oklch(var(--chart-1))",
        // ... and so on for all chart/sidebar colors
      },
      borderRadius: {
        lg: "var(--radius)", // References --radius from globals.css
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      // ... (your keyframes and animations)
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;