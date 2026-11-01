/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Corporativa Dinámica inyectada vía variables CSS en :root (AGENTS.md §3.2)
        // Soporta colores sólidos, gradientes y modificadores de opacidad (/10, /20, /40, /80)
        "plum-obsidian": "rgb(var(--palette-obsidian-rgb, 23 18 29) / <alpha-value>)",
        "plum-deep": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",
        "plum-royal": "rgb(var(--palette-royal-plum-rgb, 81 64 95) / <alpha-value>)",
        "plum-mauve": "rgb(var(--palette-mauve-rgb, 121 100 135) / <alpha-value>)",
        "plum-lilac": "rgb(var(--palette-lilac-rgb, 176 155 184) / <alpha-value>)",
        "plum-silk": "rgb(var(--palette-silk-rgb, 232 221 235) / <alpha-value>)",

        // Mapeo Semántico Reactivo OdontoSalud
        "dental-ambient-bg": "rgb(var(--palette-obsidian-rgb, 23 18 29) / <alpha-value>)",
        "dental-deep-navy": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",
        "primary": "rgb(var(--color-primary-rgb, 81 64 95) / <alpha-value>)",
        "primary-container": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",
        "electric-blue": "rgb(var(--color-primary-rgb, 81 64 95) / <alpha-value>)",
        "vibrant-cyan": "rgb(var(--palette-lilac-rgb, 176 155 184) / <alpha-value>)",
        "secondary": "rgb(var(--color-secondary-rgb, 121 100 135) / <alpha-value>)",
        "secondary-container": "rgb(var(--color-surface-rgb, 232 221 235) / <alpha-value>)",
        "tertiary": "rgb(var(--color-primary-rgb, 81 64 95) / <alpha-value>)",
        "tertiary-container": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",

        // Superficies Sólidas y Definidas 100% Reactivas
        "background": "rgb(var(--color-bg-rgb, 244 238 247) / <alpha-value>)",
        "surface": "rgb(var(--color-bg-rgb, 244 238 247) / <alpha-value>)",
        "surface-bright": "#FFFFFF",
        "surface-clean-white": "#FFFFFF",
        "surface-container-lowest": "#FFFFFF",
        "surface-subtle-ice": "rgb(var(--color-bg-rgb, 244 238 247) / <alpha-value>)",
        "surface-container-low": "rgb(var(--color-surface-rgb, 232 221 235) / <alpha-value>)",
        "surface-container": "rgb(var(--color-surface-rgb, 232 221 235) / <alpha-value>)",
        "surface-container-high": "rgb(var(--color-surface-rgb, 232 221 235) / <alpha-value>)",
        "surface-container-highest": "rgb(var(--palette-lilac-rgb, 176 155 184) / <alpha-value>)",
        "surface-variant": "rgb(var(--color-surface-rgb, 232 221 235) / <alpha-value>)",
        "surface-dim": "rgb(var(--palette-lilac-rgb, 176 155 184) / <alpha-value>)",
        "surface-tint": "rgb(var(--color-primary-rgb, 81 64 95) / <alpha-value>)",

        // Fijos y Acentos con Cuerpo Sólido
        "primary-fixed": "rgb(var(--color-surface-rgb, 232 221 235) / <alpha-value>)",
        "primary-fixed-dim": "rgb(var(--palette-lilac-rgb, 176 155 184) / <alpha-value>)",
        "secondary-fixed": "rgb(var(--color-surface-rgb, 232 221 235) / <alpha-value>)",
        "secondary-fixed-dim": "rgb(var(--palette-lilac-rgb, 176 155 184) / <alpha-value>)",
        "tertiary-fixed": "rgb(var(--color-surface-rgb, 232 221 235) / <alpha-value>)",
        "tertiary-fixed-dim": "rgb(var(--palette-lilac-rgb, 176 155 184) / <alpha-value>)",

        // Textos y Contrastes (WCAG AA/AAA)
        "on-surface": "rgb(var(--color-text-rgb, 23 18 29) / <alpha-value>)",
        "on-background": "rgb(var(--color-text-rgb, 23 18 29) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",
        "on-primary": "#FFFFFF",
        "on-primary-container": "rgb(var(--palette-silk-rgb, 232 221 235) / <alpha-value>)",
        "on-secondary": "#FFFFFF",
        "on-secondary-container": "rgb(var(--color-text-rgb, 23 18 29) / <alpha-value>)",
        "on-tertiary": "#FFFFFF",
        "on-tertiary-container": "rgb(var(--palette-silk-rgb, 232 221 235) / <alpha-value>)",
        "on-primary-fixed": "rgb(var(--color-text-rgb, 23 18 29) / <alpha-value>)",
        "on-primary-fixed-variant": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",
        "on-secondary-fixed": "rgb(var(--color-text-rgb, 23 18 29) / <alpha-value>)",
        "on-secondary-fixed-variant": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",
        "on-tertiary-fixed": "rgb(var(--color-text-rgb, 23 18 29) / <alpha-value>)",
        "on-tertiary-fixed-variant": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",
        "inverse-surface": "rgb(var(--palette-aubergine-rgb, 48 37 56) / <alpha-value>)",
        "inverse-on-surface": "rgb(var(--palette-silk-rgb, 232 221 235) / <alpha-value>)",
        "inverse-primary": "rgb(var(--palette-lilac-rgb, 176 155 184) / <alpha-value>)",

        // Bordes Sólidos y Visibles
        "outline": "rgb(var(--color-secondary-rgb, 121 100 135) / <alpha-value>)",
        "outline-variant": "rgb(var(--color-border-rgb, 176 155 184) / <alpha-value>)",
        "border-subtle": "rgb(var(--color-border-rgb, 176 155 184) / <alpha-value>)",

        // Estados Clínicos Semánticos
        "status-success": "#10B981",
        "status-warning": "#F59E0B",
        "status-danger": "#EF4444",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        full: "9999px",
      },
      spacing: {
        "gutter-mobile": "0.75rem",
        "space-md": "1rem",
        gutter: "1.5rem",
        "space-lg": "1.5rem",
        "space-xs": "0.25rem",
        margin: "2rem",
        "margin-mobile": "1rem",
        "space-xl": "2.5rem",
        "space-sm": "0.5rem",
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        display: ["Sora", "sans-serif"],
      },
    },
  },
  plugins: [],
};
