import type { Config } from 'tailwindcss';
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { azul: { DEFAULT: '#1E8CF0', oscuro: '#0F5FB8' }, lima: '#D8F55A', caramelo: '#B8743A', crema: '#FFF7E6', madera: '#4A2F1D' },
    fontFamily: { titulo: ['Fredoka', 'system-ui', 'sans-serif'], cuerpo: ['Nunito', 'system-ui', 'sans-serif'] },
  } },
  plugins: [],
} satisfies Config;
