/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        frost: {
          50: "#F5F7F8",
          100: "#EAEEF0",
          200: "#D6DBDD",
        },
        steel: {
          700: "#3C4A56",
          800: "#28333D",
          900: "#1B2530",
        },
        clinical: {
          light: "#6FB8BA",
          DEFAULT: "#0F8B8D",
          dark: "#0B6B6D",
        },
        frostblue: {
          light: "#7FB3C4",
          DEFAULT: "#4A90A4",
          dark: "#356E7E",
        },
        blood: {
          light: "#E37784",
          DEFAULT: "#C0293B",
          dark: "#8F1D2C",
        },
        amber: {
          DEFAULT: "#D98E04",
        },
      },
      fontFamily: {
        display: ["'IBM Plex Sans'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(27,37,48,0.06), 0 4px 12px rgba(27,37,48,0.05)",
      },
    },
  },
  plugins: [],
}

