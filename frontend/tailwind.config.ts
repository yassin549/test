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
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        amber: 'var(--amber)',
        success: 'var(--success)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
      },
      transitionDuration: {
        quick: 'var(--motion-quick)',
        short: 'var(--motion-short)',
        medium: 'var(--motion-medium)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-fluid-type')],
} as Config;
export default config;
