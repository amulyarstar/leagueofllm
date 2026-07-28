import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#05070D",
          elevated: "#0B0F1C",
          panel: "#10162A",
        },
        line: "rgba(255,255,255,0.08)",
        ink: {
          DEFAULT: "#E7E9F3",
          muted: "#8A90AC",
          faint: "#5B6182",
        },
        neon: {
          cyan: "#22D3EE",
          magenta: "#F0479C",
          violet: "#A78BFA",
          amber: "#FBBF24",
          green: "#4ADE80",
          red: "#FB7185",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
        "arena-glow":
          "radial-gradient(60% 50% at 50% 0%, rgba(167,139,250,0.18) 0%, rgba(5,7,13,0) 70%)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
      boxShadow: {
        "neon-cyan": "0 0 0 1px rgba(34,211,238,0.4), 0 0 24px rgba(34,211,238,0.25)",
        "neon-magenta": "0 0 0 1px rgba(240,71,156,0.4), 0 0 24px rgba(240,71,156,0.25)",
        "neon-violet": "0 0 0 1px rgba(167,139,250,0.4), 0 0 24px rgba(167,139,250,0.25)",
        "neon-amber": "0 0 0 1px rgba(251,191,36,0.4), 0 0 24px rgba(251,191,36,0.25)",
        glass: "0 8px 32px rgba(0,0,0,0.35)",
      },
      keyframes: {
        pulseRing: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulseRing: "pulseRing 2.4s ease-in-out infinite",
        rise: "rise 0.5s ease-out both",
        shimmer: "shimmer 1.8s linear infinite",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
