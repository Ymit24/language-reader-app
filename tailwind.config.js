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
        canvas: "#f6f2ea",
        panel: "#fffdf8",
        muted: "#f0ebe1",
        ink: "#1f1a17",
        subink: "#524a43",
        faint: "#80776e",
        border: "#e1d7c9",
        border2: "#cdbfaf",
        brand: "#2f6b66",
        brandSoft: "#e4f1ef",
        accent: "#b56a2c",
        danger: "#b42318",
        dangerSoft: "#fdeeee",
        success: "#1d6b4f",
        successSoft: "#e8f5ef",
        vUnknownBg: "#fdf1e1",
        vUnknownLine: "#d08b35",
        vLearningBg: "#e6eef5",
        vLearningLine: "#3c7da8",
        vKnownBg: "#e6f3ec",
        vKnownLine: "#2f7a57",
      },
      boxShadow: {
        card: "0 1px 2px rgba(31,26,23,0.06)",
        pop: "0 18px 40px rgba(31,26,23,0.14)",
        lift: "0 12px 24px rgba(31,26,23,0.1)",
      },
      fontFamily: {
        sans: ["PlusJakartaSans_400Regular"],
        "sans-medium": ["PlusJakartaSans_500Medium"],
        "sans-semibold": ["PlusJakartaSans_600SemiBold"],
        "sans-bold": ["PlusJakartaSans_700Bold"],
        serif: ["Newsreader_400Regular"],
        "serif-medium": ["Newsreader_500Medium"],
        "serif-semibold": ["Newsreader_600SemiBold"],
        "serif-bold": ["Newsreader_700Bold"],
        "serif-italic": ["Newsreader_400Regular_Italic"],
      },
    },
  },
  plugins: [],
}
