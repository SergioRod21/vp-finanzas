import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En desarrollo, el servidor de Vite reenvía /api al backend (como nginx en Docker).
// Así el código siempre usa rutas relativas y comparte origen con la API.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    proxy: { '/api': { target: API_PROXY_TARGET, changeOrigin: true } },
  },
})
