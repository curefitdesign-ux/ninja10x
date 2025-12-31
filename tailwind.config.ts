import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "430px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
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
        aurora: {
          cyan: "hsl(var(--aurora-cyan))",
          yellow: "hsl(var(--aurora-yellow))",
          pink: "hsl(var(--aurora-pink))",
          green: "hsl(var(--aurora-green))",
          blue: "hsl(var(--aurora-blue))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "liquid-bounce": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(0.92)" },
          "50%": { transform: "scale(1.08)" },
          "75%": { transform: "scale(0.97)" },
          "100%": { transform: "scale(1)" },
        },
        "liquid-enter": {
          "0%": { opacity: "0", transform: "scale(0.6) translateY(40px)", filter: "blur(10px)" },
          "40%": { opacity: "0.8", transform: "scale(1.08) translateY(-10px)", filter: "blur(2px)" },
          "70%": { transform: "scale(0.95) translateY(5px)", filter: "blur(0)" },
          "85%": { transform: "scale(1.02) translateY(-2px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)", filter: "blur(0)" },
        },
        "input-focus-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)" },
          "50%": { boxShadow: "0 0 20px 2px rgba(255, 255, 255, 0.15)" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(255, 255, 255, 0)" },
          "50%": { borderColor: "rgba(255, 255, 255, 0.3)" },
        },
        "toast-rise": {
          "0%": { opacity: "0", transform: "translateY(100px) scale(0.8)", filter: "blur(8px)" },
          "60%": { opacity: "1", transform: "translateY(-15px) scale(1.05)", filter: "blur(0)" },
          "80%": { transform: "translateY(5px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
        },
        "toast-float": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-5px) scale(1.02)" },
        },
        "toast-expand": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "40%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(15)", opacity: "0", filter: "blur(10px)" },
        },
        "camera-enter": {
          "0%": { opacity: "0", transform: "scale(0.9)", filter: "blur(5px)" },
          "50%": { opacity: "1", transform: "scale(1.02)", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "scale(1)", filter: "blur(0)" },
        },
        "cta-pop": {
          "0%": { opacity: "0", transform: "scale(0.8) translateY(4px)" },
          "50%": { opacity: "1", transform: "scale(1.1) translateY(-2px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "liquid-bounce": "liquid-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "liquid-enter": "liquid-enter 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "input-focus-pulse": "input-focus-pulse 2s ease-in-out infinite",
        "border-glow": "border-glow 2s ease-in-out infinite",
        "toast-rise": "toast-rise 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "toast-float": "toast-float 1.5s ease-in-out infinite",
        "toast-expand": "toast-expand 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "camera-enter": "camera-enter 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
