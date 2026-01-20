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
        canvas: "#FDFBF7",
        panel: "#FFFEFA",
        muted: "#F5F3EF",
        ink: "#2D2820",
        subink: "#5C5648",
        faint: "#7A7466",
        border: "#E8E4DC",
        border2: "#D4CFC2",
        brand: "#C4643B",
        brandSoft: "#FDF4ED",
        danger: "#B33A3A",
        dangerSoft: "#FDF3F3",
        success: "#4A7C59",
        successSoft: "#F5F9F3",
        vUnknownBg: "#FFF7ED",
        vUnknownLine: "#D97706",
        vLearningBg: "#FDF4ED",
        vLearningLine: "#C4643B",
        vKnownBg: "#F5F9F3",
        vKnownLine: "#4A7C59",
      },
      boxShadow: {
        card: "0 1px 2px rgba(45,40,32,0.06)",
        pop: "0 10px 30px rgba(45,40,32,0.12)",
      },
    },
  },
  plugins: [],
}
