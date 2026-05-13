/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#080a12',
        panel: '#10131f',
        glass: 'rgba(255,255,255,0.08)',
        line: 'rgba(255,255,255,0.12)',
        mint: '#62f6c8',
        coral: '#ff6f61',
        amber: '#f9bd5f',
        sky: '#69c7ff'
      },
      boxShadow: {
        glow: '0 0 42px rgba(98, 246, 200, 0.22)',
        soft: '0 24px 80px rgba(0,0,0,0.45)'
      },
      backdropBlur: {
        xs: '2px'
      }
    }
  },
  plugins: []
};
