   
                               
                                                                    
                                                                               
   

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#5858E2",
          hover: "#4646c9",
          muted: "rgba(88, 88, 226, 0.12)",
        },
        accent: {
          DEFAULT: "#A7FF5A",
          hover: "#8ee64a",
          muted: "rgba(167, 255, 90, 0.2)",
        },
        neutral: {
          DEFAULT: "#BFBFBF",
          light: "#e5e5e5",
          dark: "#8c8c8c",
        },
        background: {
          DEFAULT: "#F8F7F4",                                 
          subtle: "#F0EFEB",
        },
      },
      borderRadius: {
        card: "1rem",
        button: "1rem",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.06)",
        "glass-strong": "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
