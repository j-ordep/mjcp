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
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))', pressed: 'hsl(var(--primary-pressed))', border: 'hsl(var(--primary-border))' },
        'inverse-muted': 'hsl(var(--inverse-muted))',
        disabled: 'hsl(var(--disabled))',
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))', muted: 'hsl(var(--destructive-muted))', border: 'hsl(var(--destructive-border))' },
        success: { DEFAULT: 'hsl(var(--success))', muted: 'hsl(var(--success-muted))' },
        warning: { DEFAULT: 'hsl(var(--warning))', muted: 'hsl(var(--warning-muted))' },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
