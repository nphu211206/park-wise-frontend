// tailwind.config.js (PHIÊN BẢN ĐẲNG CẤP)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}', // Nếu dùng App Router
  ],
  theme: {
    extend: {
      // Mở rộng font chữ để khớp với file globals.css
      fontFamily: {
        sans: ['Be Vietnam Pro', 'sans-serif'],
      },
      // Mở rộng màu sắc để sử dụng các biến CSS "đẳng cấp"
      colors: {
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-link': 'var(--color-text-link)',
        
        brand: {
          light: '#58A6FF',
          DEFAULT: 'var(--color-brand)',
          dark: 'var(--color-brand-hover)',
        },
        success: 'var(--color-success)',
        danger: 'var(--color-danger)',
        warning: 'var(--color-warning)',
      },
      // Hiệu ứng "Bùng nổ" (giống Framer Motion)
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        glow: {
            '0%, 100%': { boxShadow: '0 0 5px #58A6FF' },
            '50%': { boxShadow: '0 0 20px #58A6FF' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out',
        glow: 'glow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [
    // Thêm plugin này để có form đẹp hơn
    require('@tailwindcss/forms'),
  ],
};