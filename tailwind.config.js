/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': 'rgb(var(--color-app) / <alpha-value>)',
        'card-bg': 'rgb(var(--color-card) / <alpha-value>)',
        'border': 'rgb(var(--color-border) / <alpha-value>)',
        'accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'hover': 'rgb(var(--color-hover) / <alpha-value>)',
        'danger': 'rgb(var(--color-danger) / <alpha-value>)',
        'success': 'rgb(var(--color-success) / <alpha-value>)',
        'warning': 'rgb(var(--color-warning) / <alpha-value>)',
      },
      borderRadius: {
        xl: '12px',
        lg: '8px',
        md: '6px',
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        slideIn: 'slideIn 200ms ease-out',
        fadeIn: 'fadeIn 200ms ease-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
