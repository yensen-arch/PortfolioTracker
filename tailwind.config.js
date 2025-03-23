/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin-slow 3s linear infinite',
        'bg-move': 'bg-move 3s linear infinite',
      },
      keyframes: {
        'spin-slow': {
          '0%': { transform: 'rotate(0deg) scale(1.05)' },
          '100%': { transform: 'rotate(360deg) scale(1.05)' },
        },
        'bg-move': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundSize: {
        '200%': '200% 100%',
      },
    },
  },
  plugins: [],
};
