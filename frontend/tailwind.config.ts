import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF4FF',
          600: '#2F6FED',
          700: '#255BE0',
        },
        gray: {
          900: '#111827',
          700: '#374151',
          500: '#6B7280',
          300: '#D1D5DB',
          200: '#E5E7EB',
          100: '#F3F4F6',
        },
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#DC2626',
        rating: '#F5B301',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['28px', { lineHeight: '34px', fontWeight: '600' }],
        'h1': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'h2': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'button': ['15px', { lineHeight: '20px', fontWeight: '600' }],
      },
      spacing: {
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '20': '20px',
        '24': '24px',
        '32': '32px',
        '40': '40px',
        '48': '48px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        'pill': '24px',
      },
      boxShadow: {
        'card': '0 10px 30px rgba(17, 24, 39, 0.10)',
        'sticky': '0 -8px 24px rgba(17, 24, 39, 0.08)',
      },
      screens: {
        'xs': '0px',
        'sm': '480px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
