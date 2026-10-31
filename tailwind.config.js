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
        // Paleta Oficial Luxury Plum & Lavender (#17121D -> #E8DDEB)
        "plum-obsidian": "#17121D",
        "plum-deep": "#302538",
        "plum-royal": "#51405F",
        "plum-mauve": "#796487",
        "plum-lilac": "#B09BB8",
        "plum-silk": "#E8DDEB",

        // Mapeo Semántico Sólido y de Alto Contraste OdontoSalud
        "dental-ambient-bg": "#17121D",
        "dental-deep-navy": "#302538",
        "primary": "#51405F",
        "primary-container": "#302538",
        "electric-blue": "#51405F",
        "vibrant-cyan": "#B09BB8",
        "secondary": "#796487",
        "secondary-container": "#E8DDEB",
        "tertiary": "#51405F",
        "tertiary-container": "#302538",

        // Superficies Sólidas y Definidas (Sin transparencia lavada)
        "background": "#F4EEF7",
        "surface": "#F4EEF7",
        "surface-bright": "#FFFFFF",
        "surface-clean-white": "#FFFFFF",
        "surface-container-lowest": "#FFFFFF",
        "surface-subtle-ice": "#EFE6F4",
        "surface-container-low": "#E8DDEB",
        "surface-container": "#E8DDEB",
        "surface-container-high": "#D8C7DF",
        "surface-container-highest": "#C6B2CE",
        "surface-variant": "#E8DDEB",
        "surface-dim": "#D0BDD8",
        "surface-tint": "#51405F",

        // Fijos y Acentos con Cuerpo Sólido
        "primary-fixed": "#D8C7DF",
        "primary-fixed-dim": "#B09BB8",
        "secondary-fixed": "#E8DDEB",
        "secondary-fixed-dim": "#B09BB8",
        "tertiary-fixed": "#E8DDEB",
        "tertiary-fixed-dim": "#B09BB8",

        // Textos y Contrastes (WCAG AAA >= 7:1)
        "on-surface": "#17121D",
        "on-background": "#17121D",
        "on-surface-variant": "#302538",
        "on-primary": "#FFFFFF",
        "on-primary-container": "#E8DDEB",
        "on-secondary": "#FFFFFF",
        "on-secondary-container": "#17121D",
        "on-tertiary": "#FFFFFF",
        "on-tertiary-container": "#E8DDEB",
        "on-primary-fixed": "#17121D",
        "on-primary-fixed-variant": "#302538",
        "on-secondary-fixed": "#17121D",
        "on-secondary-fixed-variant": "#302538",
        "on-tertiary-fixed": "#17121D",
        "on-tertiary-fixed-variant": "#302538",
        "inverse-surface": "#302538",
        "inverse-on-surface": "#E8DDEB",
        "inverse-primary": "#B09BB8",

        // Bordes Sólidos y Visibles
        "outline": "#796487",
        "outline-variant": "#B09BB8",
        "border-subtle": "#D5C4DC",

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
