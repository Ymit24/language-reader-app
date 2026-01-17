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
        canvas: "#fbfbfa",
        panel: "#ffffff",
        muted: "#f4f4f2",
        ink: "#111827",
        subink: "#4b5563",
        faint: "#6b7280",
        border: "#e5e7eb",
        border2: "#d1d5db",
        brand: "#2563eb",
        brandSoft: "#eff6ff",
        danger: "#b91c1c",
        dangerSoft: "#fef2f2",
        success: "#047857",
        successSoft: "#ecfdf5",
        vUnknownBg: "#fff7ed",
        vUnknownLine: "#f59e0b",
        vLearningBg: "#eff6ff",
        vLearningLine: "#3b82f6",
        vKnownBg: "#ecfdf5",
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
