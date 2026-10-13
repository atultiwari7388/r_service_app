import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F96176",
          hover: "#e0485d",
          light: "#FFEBF3",
        },
        secondary: {
          DEFAULT: "#58BB87",
          hover: "#48a674",
          light: "#EAF8F1",
        },
        navy: {
          DEFAULT: "#0B132B",
          card: "#1C2541",
          hover: "#273469",
        },
        orange: {
          DEFAULT: "#FF9900",
        },
        tertiary: {
          DEFAULT: "#0078A6",
        },
      },
    },
  },
  plugins: [],
};

export default config;
