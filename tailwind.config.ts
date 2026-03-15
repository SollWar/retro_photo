import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brass: "#c6904f",
        ember: "#ff7a18",
        cream: "#f2e8d5",
        ink: "#16120f",
        plum: "#4f2f3f"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 30px 80px rgba(0,0,0,0.45)"
      },
      backgroundImage: {
        noise:
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), transparent 28%), radial-gradient(circle at 80% 0%, rgba(255,122,24,0.18), transparent 30%), linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0))"
      },
      fontFamily: {
        sans: ["var(--font-sans)"]
      }
    }
  },
  plugins: []
};

export default config;
