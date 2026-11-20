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
        navy: {
          50: "#F0F4F8",
          100: "#D9E2EC",
          200: "#BCCCDC",
          300: "#9FB3C8",
          400: "#829AB1",
          500: "#627D98",
          600: "#486581",
          700: "#334E68",
          800: "#1E293B",
          900: "#0F172A",
          950: "#0A0F1D",
        },
        brand: {
          primary: "#2563EB",
          primaryHover: "#1D4ED8",
          secondary: "#0F172A",
        },
        status: {
          attention: "#D97706",
          attentionBg: "#FEF3C7",
          highRisk: "#DC2626",
          highRiskBg: "#FEE2E2",
          safe: "#059669",
          safeBg: "#D1FAE5",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      transitionTimingFunction: {
        'emil-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'emil-in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'emil-drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: {
        'micro': '160ms',
        'ui': '220ms',
        'enter': '350ms',
      },
    },
  },
  plugins: [],
};

export default config;
