/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#F5E6D3",
        panel: "#F5E6D3",
        muted: "#E8D4BE",
        ink: "#2D2416",
        subink: "#5C4A32",
        faint: "#8B7355",
        border: "#D9C4A5",
        border2: "#C9B394",
        brand: "#B45309",
        brandSoft: "#FEF3C7",
        danger: "#b91c1c",
        dangerSoft: "#FEF3E5",
        success: "#047857",
        successSoft: "#F0FDF4",
        vUnknownBg: "#fff7ed",
        vUnknownLine: "#f59e0b",
        vLearningBg: "#fef3c7",
        vLearningLine: "#d97706",
        vKnownBg: "#f0fdf4",
        vKnownLine: "#10b981",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.06)",
        pop: "0 10px 30px rgba(16,24,40,0.12)",
      },
    },
  },
  plugins: [],
}
