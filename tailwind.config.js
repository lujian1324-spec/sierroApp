/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#01D6BE',
        accent: '#01D6BE',
        success: '#34C759',
        warning: '#FF9500',
        danger: '#FF3B30',
        'bg-base': '#141414',
        'bg-card': '#262626',
        'bg-card2': '#333333',
        'txt-primary': '#FFFFFF',
        'txt-secondary': '#A0A0A5',
        'txt-muted': '#636366',
      },
      borderRadius: {
        'sm': '8px',
        'md': '14px',
        'lg': '20px',
        'xl': '28px',
        'full': '9999px',
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'wave': 'wave 4s linear infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'wave': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
