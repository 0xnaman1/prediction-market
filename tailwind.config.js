/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        border: "#2D3139",
        input: "#2D3139",
        ring: "#6E56CF",
        background: "#131518",
        foreground: "#FFFFFF",
        primary: {
          DEFAULT: "#6E56CF",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#2D3139",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#E54D2E",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#2D3139",
          foreground: "#A1A1AA",
        },
        accent: {
          DEFAULT: "#2D3139",
          foreground: "#FFFFFF",
        },
        popover: {
          DEFAULT: "#1C2127",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#1C2127",
          foreground: "#FFFFFF",
        },
        purple: {
          50: "#F6F4FF",
          100: "#EDEBFE",
          200: "#DCD7FE",
          300: "#CABFFD",
          400: "#AC94FA",
          500: "#9061F9",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
        },
        indigo: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 3s ease-in-out infinite",
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} 