/** @type {import('tailwindcss').Config} */
const withOpacity = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: withOpacity("--canvas"),
        panel: withOpacity("--panel"),
        muted: withOpacity("--muted"),
        ink: withOpacity("--ink"),
        subink: withOpacity("--subink"),
        faint: withOpacity("--faint"),
        border: withOpacity("--border"),
        border2: withOpacity("--border2"),
        brand: withOpacity("--brand"),
        brandSoft: withOpacity("--brandSoft"),
        accent: withOpacity("--accent"),
        danger: withOpacity("--danger"),
        dangerSoft: withOpacity("--dangerSoft"),
        success: withOpacity("--success"),
        successSoft: withOpacity("--successSoft"),
        vUnknownBg: withOpacity("--vUnknownBg"),
        vUnknownLine: withOpacity("--vUnknownLine"),
        vLearningBg: withOpacity("--vLearningBg"),
        vLearningLine: withOpacity("--vLearningLine"),
        vFamiliarBg: withOpacity("--vFamiliarBg"),
        vFamiliarLine: withOpacity("--vFamiliarLine"),
        vKnownBg: withOpacity("--vKnownBg"),
        vKnownLine: withOpacity("--vKnownLine"),
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
