import { fontFamily } from "tailwindcss/defaultTheme";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import tailwindcssAnimate from "tailwindcss-animate";
import tailwindcssTypography from "@tailwindcss/typography";
import tailwindcssContainerQueries from "@tailwindcss/container-queries";

// Container-query max-width variants — @tailwindcss/container-queries v0.1.1
// only ships min-width (`@4xl:`). Register `@max-{size}:` for the inverse so
// components can default to wide-screen styles and override on narrow.
const containerSizes: Record<string, string> = {
  xs: "20rem",
  sm: "24rem",
  md: "28rem",
  lg: "32rem",
  xl: "36rem",
  "2xl": "42rem",
  "3xl": "48rem",
  "4xl": "56rem",
  "5xl": "64rem",
  "6xl": "72rem",
  "7xl": "80rem",
};
const containerMaxVariants = plugin(({ addVariant }) => {
  for (const [name, value] of Object.entries(containerSizes)) {
    addVariant(`@max-${name}`, `@container (max-width: ${value})`);
  }
});

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./styles/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      margin: {
        "-23": "-23px",
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        customGray: "#F1F5F9",
        pinnedGray: "#94A3B8",
        icon: {
          DEFAULT: "hsl(var(--foreground))",
          primary: "hsl(var(--primary))",
          secondary: "hsl(var(--secondary))",
          muted: "hsl(var(--muted-foreground))",
          destructive: "hsl(var(--destructive))",
        },
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
          background: "hsl(var(--muted-background))",
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
        scrollbar: {
          DEFAULT: "hsl(var(--scrollbar-thumb))",
          hover: "hsl(var(--scrollbar-hover-thumb))",
          track: "hsl(var(--scrollbar-track))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          background: "hsl(var(--sidebar-background))",
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
        "3px": "3px",
        "8px": "8px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        slideRight: {
          "0%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        slideLeft: {
          "0%": {
            transform: "translateX(100%)",
            opacity: "1",
          },
          "100%": {
            transform: "translateX(100%)",
            opacity: "0",
          },
        },
        shimmer: {
          "0%": {
            backgroundPosition: "200% 50%",
          },
          "100%": {
            backgroundPosition: "-200% 50%",
          },
        },
        "spin-60": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "50%": {
            transform: "rotate(60deg)",
          },
          "100%": {
            transform: "rotate(0deg)",
          },
        },
        wave: {
          "0%, 100%": {
            transform: "rotate(0deg)",
          },
          "20%, 60%": {
            transform: "rotate(20deg)",
          },
          "40%, 80%": {
            transform: "rotate(-10deg)",
          },
        },
        fadeOut: {
          "0%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        slideRight: "slideRight 0.15s ease-out",
        slideLeft: "slideRight 0.15s ease-in",
        "shimmer-slow": "shimmer 4s linear infinite",
        shimmer: "shimmer 3s linear infinite",
        "shimmer-fast": "shimmer 2s linear infinite",
        wave: "wave 1s ease-in-out, fadeOut 0.3s ease-out 1.2s forwards",
      },
      screens: {
        "sidebar-breakpoint": "1100px",
        "3xl": "1700px",
      },
    },
    borderRadius: {
      none: "0",
      sm: "0.125rem",
      default: "0.25rem",
      lg: "0.5rem", // 8px
      full: "9999px",
      large: "12px", // custom value
    },
    pointerEvents: {
      none: "none",
      auto: "auto",
    },
  },
  variants: {
    extend: {
      backgroundColor: ["hover"],
    },
  },
  plugins: [
    tailwindcssAnimate,
    tailwindcssTypography,
    tailwindcssContainerQueries,
    containerMaxVariants,
  ],
} satisfies Config;

export default config;
