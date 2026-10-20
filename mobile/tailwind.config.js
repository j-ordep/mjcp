/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  darkMode: "class",
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--foreground))' },
        popover: { DEFAULT: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))' },
        card: { DEFAULT: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: '#fff' },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
