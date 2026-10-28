/** Brand tokens mirror the website (navy #033967 family); status colours as on the map. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { 950: '#010f20', 900: '#011a35', 800: '#022a4e', 700: '#033967', 600: '#085b9e', 500: '#0f7ed9', 300: '#7db8ee', 100: '#eaf0ff', 50: '#f4f7ff' },
        ink: { DEFAULT: '#14161c', soft: '#464851', muted: '#676f7e', faint: '#a4a6b0' },
        line: '#dfe5ef',
        survey: '#f2c14e',
        status: { available: '#1e9e5a', sold_out: '#d8443c', mortgaged: '#f0a020', registered: '#2f5fbf', hold: '#8e5bd0' },
      },
      fontFamily: { sans: ['Archivo', 'Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        panel: '0 1px 0 rgba(1,26,53,.06), 0 18px 40px -18px rgba(1,26,53,.35)',
        lift: '0 24px 60px -24px rgba(1,26,53,.45)',
      },
      maxWidth: { page: '1180px' },
    },
  },
  plugins: [],
};
