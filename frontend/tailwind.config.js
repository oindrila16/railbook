/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Soft black — rich charcoal, not dull grey */
        ink: {
          DEFAULT: '#232326',
          soft: '#323238',
          muted: '#48484f',
          faint: '#62626b',
        },
        paper: {
          DEFAULT: '#ffffff',
          soft: '#fafafa',
          muted: '#f5f5f7',
          glass: 'rgba(255, 255, 255, 0.9)',
        },
        line: {
          DEFAULT: '#e8e8ed',
          dark: '#d4d4dc',
        },
        accent: {
          DEFAULT: '#5f8f8a',
          soft: '#7aa8a3',
          muted: '#e6f0ef',
        },
      },
      fontFamily: {
        sans: [
          'Nunito',
          'ui-rounded',
          'system-ui',
          'Segoe UI',
          'sans-serif',
        ],
        heading: [
          'Fraunces',
          'Georgia',
          'Cambria',
          'Times New Roman',
          'serif',
        ],
      },
      fontSize: {
        'display-sm': ['2.75rem', { lineHeight: '1.14', letterSpacing: '-0.02em', fontWeight: '600' }],
        display: ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '600' }],
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
        30: '7.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(35, 35, 38, 0.05), 0 6px 24px rgba(35, 35, 38, 0.07)',
        soft: '0 14px 44px rgba(35, 35, 38, 0.09), 0 4px 14px rgba(35, 35, 38, 0.05)',
        lift: '0 20px 50px rgba(35, 35, 38, 0.1), 0 8px 20px rgba(35, 35, 38, 0.06)',
        glow: '0 0 0 1px rgba(35, 35, 38, 0.06), 0 10px 36px rgba(95, 143, 138, 0.12)',
        inner: 'inset 0 1px 2px rgba(35, 35, 38, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.75rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        400: '400ms',
        500: '500ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
};
