/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ikea: {
          blue: '#0051BA',
          yellow: '#FFDB00',
          paper: '#F5F1E8',
          ink: '#0A0A0A',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
