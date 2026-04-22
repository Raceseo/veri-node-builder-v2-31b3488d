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
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["'Pretendard Variable'", "Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "sans-serif"],
        serif: ["'Noto Serif KR'", "Georgia", "'Times New Roman'", "serif"],
        stat: ["'Pretendard Variable'", "Pretendard", "sans-serif"],
        display: ["'Pretendard Variable'", "Pretendard", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.03em",
        tight: "-0.02em",
      },
      lineHeight: {
        relaxed: "1.6",
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          light: "hsl(var(--success-light))",
          dark: "hsl(var(--success-dark))",
        },
        trust: {
          DEFAULT: "hsl(var(--trust))",
          foreground: "hsl(var(--trust-foreground))",
          light: "hsl(var(--trust-light))",
          dark: "hsl(var(--trust-dark))",
        },
        trustTeal: {
          DEFAULT: "hsl(var(--trust-teal))",
          light: "hsl(var(--trust-teal-light))",
          dark: "hsl(var(--trust-teal-dark))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        navy: {
          DEFAULT: "hsl(var(--navy))",
          light: "hsl(var(--navy-light))",
          dark: "hsl(var(--navy-dark))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
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
        xl: "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "draw-arc": {
          from: { strokeDashoffset: "283" },
          to: { strokeDashoffset: "var(--arc-offset, 0)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.3" },
          "50%": { transform: "translateY(-20px)", opacity: "1" },
        },
        "float-gentle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "shimmer": {
          "0%": { opacity: "0.5" },
          "50%": { opacity: "1" },
          "100%": { opacity: "0.5" },
        },
        "coin-fly": {
          "0%": { 
            transform: "translateY(0) scale(1)",
            opacity: "1"
          },
          "50%": { 
            transform: "translateY(-100px) scale(1.2)",
            opacity: "1"
          },
          "100%": { 
            transform: "translateY(-200px) scale(0.5)",
            opacity: "0"
          },
        },
        "switch-glow": {
          "0%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
          "50%": { boxShadow: "0 0 30px 10px rgba(16, 185, 129, 0.4)" },
          "100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.1)" },
        },
        "heartbeat": {
          "0%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.1)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.1)" },
          "70%": { transform: "scale(1)" },
        },
        "float-particle": {
          "0%, 100%": { 
            transform: "translateY(0) translateX(0)",
            opacity: "0.2"
          },
          "50%": { 
            transform: "translateY(-30px) translateX(10px)",
            opacity: "0.6"
          },
        },
        "sparkle": {
          "0%, 100%": { opacity: "0", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "celebration": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "50%": { transform: "translateY(-100px) scale(1.2)", opacity: "1" },
          "100%": { transform: "translateY(-200px) scale(0.5)", opacity: "0" },
        },
        "confetti": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-300px) rotate(720deg)", opacity: "0" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "score-up": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "data-disappear": {
          "0%": { opacity: "1", transform: "scale(1)", filter: "blur(0)" },
          "50%": { opacity: "0.5", transform: "scale(1.05)", filter: "blur(2px)" },
          "100%": { opacity: "0.3", transform: "scale(0.98)", filter: "blur(0)" },
        },
        "stamp-appear": {
          "0%": { transform: "scale(3) rotate(-45deg)", opacity: "0" },
          "70%": { transform: "scale(1.1) rotate(5deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        "certificate-reveal": {
          "0%": { opacity: "0", transform: "translateY(50px) scale(0.9)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "statistics-reveal": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "scale-in": "scale-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.6s ease-out forwards",
        "draw-arc": "draw-arc 1.5s ease-out forwards",
        "float": "float 4s ease-in-out infinite",
        "float-gentle": "float-gentle 3s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "shimmer": "shimmer 2s ease-in-out infinite",
        "coin-fly": "coin-fly 1.2s ease-out forwards",
        "switch-glow": "switch-glow 1s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "heartbeat": "heartbeat 1.5s ease-in-out infinite",
        "float-particle": "float-particle 4s ease-in-out infinite",
        "sparkle": "sparkle 0.6s ease-out forwards",
        "celebration": "celebration 1s ease-out forwards",
        "confetti": "confetti 1.5s ease-out forwards",
        "bounce-in": "bounce-in 0.5s ease-out forwards",
        "score-up": "score-up 0.5s ease-out",
        "data-disappear": "data-disappear 0.6s ease-out forwards",
        "stamp-appear": "stamp-appear 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "certificate-reveal": "certificate-reveal 0.6s ease-out forwards",
        "statistics-reveal": "statistics-reveal 0.5s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;