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
  build: {
    rolldownOptions: {
      output: {
        // Las librerías cambian menos que el código del portal: en chunks propios, el
        // navegador las conserva en caché entre despliegues (nginx cachea /assets sin límite).
        codeSplitting: {
          groups: [
            { name: 'mantine', test: /node_modules[\\/]@mantine[\\/]/, priority: 2 },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  server: {
    proxy: { '/api': { target: API_PROXY_TARGET, changeOrigin: true } },
  },
})
