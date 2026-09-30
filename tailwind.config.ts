import type { Config } from "tailwindcss";

// 颜色名称保留为兼容别名，真实色值由主题 CSS 变量驱动。
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--color-canvas) / <alpha-value>)",
        carbon: "rgb(var(--color-surface) / <alpha-value>)",
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        bone: "rgb(var(--color-foreground) / <alpha-value>)",
        mist: "rgb(var(--color-muted) / <alpha-value>)",
        gold: "rgb(var(--color-accent) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        onMedia: "rgb(var(--color-on-media) / <alpha-value>)",
        mediaScrim: "rgb(var(--color-media-scrim) / <alpha-value>)",
        accentHover: "rgb(var(--color-accent-hover) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        display: ["var(--font-hero-display)", "STSong", "SimSun", "serif"],
        cn: ["var(--font-noto-sans-sc)", "Microsoft YaHei", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      maxWidth: { content: "1400px" },
      borderRadius: { card: "16px", control: "10px" },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      backgroundImage: {
        "stage-grid": "var(--stage-grid-image)",
      },
    },
  },
  plugins: [],
};
export default config;
