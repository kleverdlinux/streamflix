/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sf: {
          'base': '#000000',
          'secondary': '#0C0C1D',
          'elevated': '#141432',
          'accent': '#00D4AA',
          'accent-secondary': '#00B4D8',
          'accent-tertiary': '#43E97B',
          'text': '#E8F4F0',
          'text-secondary': '#7A9E96',
          'border': 'rgba(0, 212, 170, 0.15)',
        },
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      backdropBlur: {
        'glass': '20px',
      },
      backgroundSize: {
        '300%': '300%',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'border-spin': 'border-spin 3s linear infinite',
        'gradient': 'gradient 4s ease infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 170, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 212, 170, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'border-spin': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
};
