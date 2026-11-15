import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // Puerto fijo del módulo de Búsqueda (contrato del Host App, sección 3): el 5173 es de Catálogo.
  server: { port: 5174, strictPort: true },
})
